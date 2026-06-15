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
  const period = searchParams.get("period") ?? "week"; // day | week | month

  const shop = await prisma.shop.findFirst({
    where: { ownerId: user.id, ...(shopId ? { id: shopId } : {}) },
  });

  if (!shop) return NextResponse.json({ success: false, message: "Shop not found" }, { status: 404 });

  const now = new Date();
  const periodMap: Record<string, Date> = {
    day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  };
  const since = periodMap[period];

  // Build 7-day window (always Mon–Sun of the current week)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Previous period for trend comparison
  const prevSince = new Date(since.getTime() - (now.getTime() - since.getTime()));

  const [
    totalBookings,
    prevTotalBookings,
    completedBookings,
    cancelledBookings,
    noShows,
    prevNoShows,
    revenue,
    prevRevenue,
    totalCustomers,
    prevCustomers,
    queueToday,
    topBarbers,
    recentBookings,
    paymentsByProvider,
    weeklyPayments,
  ] = await Promise.all([
    prisma.booking.count({ where: { shopId: shop.id, createdAt: { gte: since } } }),
    prisma.booking.count({ where: { shopId: shop.id, createdAt: { gte: prevSince, lt: since } } }),
    prisma.booking.count({ where: { shopId: shop.id, status: "COMPLETED", createdAt: { gte: since } } }),
    prisma.booking.count({ where: { shopId: shop.id, status: "CANCELLED", createdAt: { gte: since } } }),
    prisma.booking.count({ where: { shopId: shop.id, status: "NO_SHOW", createdAt: { gte: since } } }),
    prisma.booking.count({ where: { shopId: shop.id, status: "NO_SHOW", createdAt: { gte: prevSince, lt: since } } }),
    prisma.payment.aggregate({
      where: { shopId: shop.id, status: "PAID", createdAt: { gte: since } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { shopId: shop.id, status: "PAID", createdAt: { gte: prevSince, lt: since } },
      _sum: { amount: true },
    }),
    prisma.booking.groupBy({
      by: ["customerId"],
      where: { shopId: shop.id, createdAt: { gte: since } },
      _count: true,
    }),
    prisma.booking.groupBy({
      by: ["customerId"],
      where: { shopId: shop.id, createdAt: { gte: prevSince, lt: since } },
      _count: true,
    }),
    prisma.queueEntry.count({
      where: {
        shopId: shop.id,
        joinedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.barber.findMany({
      where: { shopId: shop.id, isActive: true },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { rating: "desc" },
      take: 5,
    }),
    prisma.booking.findMany({
      where: { shopId: shop.id, createdAt: { gte: since } },
      include: {
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
        barber: { include: { user: { select: { name: true } } } },
        service: { select: { name: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.payment.groupBy({
      by: ["provider"],
      where: { shopId: shop.id, status: "PAID", createdAt: { gte: since } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.findMany({
      where: { shopId: shop.id, status: "PAID", createdAt: { gte: weekStart, lt: weekEnd } },
      select: { amount: true, createdAt: true },
    }),
  ]);

  // Aggregate payments per day of week (0=Mon … 6=Sun)
  const weeklyRevenue = [0, 0, 0, 0, 0, 0, 0];
  for (const p of weeklyPayments) {
    const dayIdx = (new Date(p.createdAt).getDay() + 6) % 7;
    weeklyRevenue[dayIdx] += p.amount;
  }

  // Compute best day name
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const bestDayIdx = weeklyRevenue.indexOf(Math.max(...weeklyRevenue));
  const bestDay = weeklyRevenue[bestDayIdx] > 0 ? dayNames[bestDayIdx] : "—";

  // Trend helpers
  const pct = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? "+100%" : "0%";
    const diff = ((curr - prev) / prev) * 100;
    return (diff >= 0 ? "+" : "") + diff.toFixed(0) + "%";
  };

  const noShowRate = totalBookings > 0 ? ((noShows / totalBookings) * 100).toFixed(1) : "0";
  const completionRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : "0";
  const totalRevenue = revenue._sum.amount ?? 0;
  const prevTotalRevenue = prevRevenue._sum.amount ?? 0;
  const prevNoShowRate = prevTotalBookings > 0 ? ((prevNoShows / prevTotalBookings) * 100) : 0;

  return NextResponse.json({
    success: true,
    data: {
      shop: { id: shop.id, name: shop.name, slug: shop.slug },
      period,
      metrics: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        noShows,
        noShowRate: parseFloat(noShowRate),
        completionRate: parseFloat(completionRate),
        totalRevenue,
        uniqueCustomers: totalCustomers.length,
        queueToday,
        trends: {
          revenue: pct(totalRevenue, prevTotalRevenue),
          revenueUp: totalRevenue >= prevTotalRevenue,
          bookings: pct(totalBookings, prevTotalBookings),
          bookingsUp: totalBookings >= prevTotalBookings,
          customers: pct(totalCustomers.length, prevCustomers.length),
          customersUp: totalCustomers.length >= prevCustomers.length,
          noShowRate: pct(parseFloat(noShowRate), prevNoShowRate),
          noShowRateUp: parseFloat(noShowRate) <= prevNoShowRate,
        },
      },
      weeklyRevenue,
      bestDay,
      topBarbers,
      recentBookings,
      paymentsByProvider,
    },
  });
}
