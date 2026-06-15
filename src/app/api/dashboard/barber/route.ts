import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user || !["BARBER", "OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const barber = await prisma.barber.findUnique({
    where: { userId: user.id },
    include: { shop: true },
  });

  if (!barber) return NextResponse.json({ success: false, message: "Barber profile not found" }, { status: 404 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todayBookings, queueNow, completedToday, revenueToday, upcomingBookings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        barberId: barber.id,
        scheduledAt: { gte: todayStart, lte: todayEnd },
        status: { notIn: ["CANCELLED"] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
        service: true,
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.queueEntry.findMany({
      where: {
        barberId: barber.id,
        status: { in: ["WAITING", "CALLED", "IN_SERVICE"] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: true,
      },
      orderBy: [{ isPremium: "desc" }, { queueNumber: "asc" }],
    }),
    prisma.booking.count({
      where: { barberId: barber.id, status: "COMPLETED", completedAt: { gte: todayStart } },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { barberId: barber.id },
        status: "PAID",
        paidAt: { gte: todayStart },
      },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      where: {
        barberId: barber.id,
        scheduledAt: { gt: new Date() },
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
        service: true,
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      barber: {
        id: barber.id,
        name: user.name,
        avatar: user.avatar,
        rating: barber.rating,
        isAvailable: barber.isAvailable,
        shop: { id: barber.shop.id, name: barber.shop.name, slug: barber.shop.slug },
      },
      today: {
        bookings: todayBookings,
        completedCount: completedToday,
        revenue: revenueToday._sum.amount ?? 0,
        queueCount: queueNow.length,
      },
      queue: queueNow,
      upcoming: upcomingBookings,
    },
  });
}
