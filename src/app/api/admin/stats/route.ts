import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");

  if (!userId || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalShops,
    totalUsers,
    totalBookings,
    activeShops,
    pendingVerification,
    revenueAgg,
    noShowAgg,
    completedAgg,
    recentShops,
    recentUsers,
    lastMonth,
    thisMonth,
  ] = await Promise.all([
    prisma.shop.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.booking.count({ where: { deletedAt: null } }),
    prisma.shop.count({ where: { isActive: true, deletedAt: null } }),
    prisma.shop.count({ where: { isVerified: false, deletedAt: null } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.booking.count({ where: { status: "NO_SHOW" } }),
    prisma.booking.count({ where: { status: { in: ["COMPLETED", "NO_SHOW"] } } }),
    prisma.shop.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, city: true, ownerId: true, isVerified: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, phone: true, role: true, createdAt: true },
    }),
    prisma.shop.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 2)),
          lt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    }),
    prisma.shop.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    }),
  ]);

  const noShowRate = completedAgg > 0 ? noShowAgg / completedAgg : 0;
  const monthlyGrowth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : thisMonth * 100;

  return NextResponse.json({
    data: {
      totalShops,
      totalUsers,
      totalBookings,
      totalRevenue: revenueAgg._sum.amount ?? 0,
      activeShops,
      pendingVerification,
      noShowRate,
      monthlyGrowth,
      recentShops,
      recentUsers,
    },
  });
}
