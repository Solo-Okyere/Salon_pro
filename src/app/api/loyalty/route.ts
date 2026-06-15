import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

// Tier thresholds
const TIERS = [
  { name: "PLATINUM", minVisits: 50 },
  { name: "GOLD", minVisits: 20 },
  { name: "SILVER", minVisits: 10 },
  { name: "BRONZE", minVisits: 0 },
] as const;

function getTier(visits: number): "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" {
  return TIERS.find((t) => visits >= t.minVisits)!.name;
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");

  const account = await prisma.loyaltyAccount.findFirst({
    where: { customerId: user.id, ...(shopId ? { shopId } : {}) },
    include: {
      shop: { select: { id: true, name: true } },
      transactions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  const rewards = await prisma.loyaltyReward.findMany({
    where: { isActive: true, ...(shopId ? { shopId } : { shopId: null }) },
  });

  return NextResponse.json({
    success: true,
    data: { account, rewards },
  });
}

// Award points after completed booking
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { bookingId, shopId } = await req.json();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, customerId: user.id, status: "COMPLETED" },
    include: { service: true },
  });

  if (!booking) {
    return NextResponse.json({ success: false, message: "Booking not found or not completed" }, { status: 404 });
  }

  // Points = GHS spent (1 point per GHS)
  const pointsEarned = Math.floor(booking.totalAmount);

  const account = await prisma.loyaltyAccount.upsert({
    where: { customerId_shopId: { customerId: user.id, shopId } },
    update: {
      points: { increment: pointsEarned },
      totalVisits: { increment: 1 },
      totalSpent: { increment: booking.totalAmount },
    },
    create: {
      customerId: user.id,
      shopId,
      points: pointsEarned,
      totalVisits: 1,
      totalSpent: booking.totalAmount,
    },
  });

  // Update tier
  const newTier = getTier(account.totalVisits);
  await prisma.loyaltyAccount.update({
    where: { id: account.id },
    data: { tier: newTier },
  });

  await prisma.loyaltyTransaction.create({
    data: {
      loyaltyAccountId: account.id,
      points: pointsEarned,
      type: "EARN",
      description: `Earned from ${booking.service.name}`,
      bookingId,
    },
  });

  return NextResponse.json({ success: true, data: { pointsEarned, totalPoints: account.points + pointsEarned, tier: newTier } });
}
