import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");
  const customerId = searchParams.get("customerId");

  const id = customerId ?? user.id;

  // Calculate no-show risk from history
  const [totalBookings, noShows] = await Promise.all([
    prisma.booking.count({ where: { customerId: id } }),
    prisma.booking.count({ where: { customerId: id, status: "NO_SHOW" } }),
  ]);

  const historicalRate = totalBookings > 0 ? noShows / totalBookings : 0;

  let risk = historicalRate;

  // Adjust for specific booking if provided
  if (bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { depositPaid: true, scheduledAt: true },
    });

    if (booking) {
      // Deposit paid = lower risk
      if (booking.depositPaid) risk *= 0.4;

      // Weekend = slightly higher risk
      const dow = new Date(booking.scheduledAt).getDay();
      if (dow === 0 || dow === 6) risk *= 1.2;

      // Early morning (before 9am) = higher risk
      const hour = new Date(booking.scheduledAt).getHours();
      if (hour < 9) risk *= 1.3;
    }
  }

  risk = Math.min(1, risk);

  const level = risk >= 0.5 ? "HIGH" : risk >= 0.25 ? "MEDIUM" : "LOW";

  return NextResponse.json({
    success: true,
    data: {
      customerId: id,
      riskScore: parseFloat(risk.toFixed(3)),
      level,
      historicalNoShowRate: parseFloat(historicalRate.toFixed(3)),
      totalBookings,
      totalNoShows: noShows,
      recommendation:
        level === "HIGH" ? "Require deposit or send extra reminder" :
        level === "MEDIUM" ? "Send reminder 2 hours before" :
        "Standard reminder",
    },
  });
}
