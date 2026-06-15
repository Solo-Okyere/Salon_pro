import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  if (!shopId) return NextResponse.json({ success: false, message: "shopId required" }, { status: 400 });

  // Get all customer IDs who have booked this shop
  const customerIds = await prisma.booking.findMany({
    where: { shopId, deletedAt: null },
    select: { customerId: true },
    distinct: ["customerId"],
  });

  const ids = customerIds.map((c) => c.customerId);

  const customers = await prisma.user.findMany({
    where: {
      id: { in: ids },
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    include: {
      loyaltyAccounts: { where: { shopId }, select: { points: true, tier: true, totalVisits: true, totalSpent: true } },
      bookings: {
        where: { shopId, deletedAt: null },
        orderBy: { scheduledAt: "desc" },
        take: 1,
        select: { scheduledAt: true, status: true },
      },
      _count: {
        select: {
          bookings: true,
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({
    success: true,
    data: customers,
    total: ids.length,
    page,
    limit,
    totalPages: Math.ceil(ids.length / limit),
  });
}
