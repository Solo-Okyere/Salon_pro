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
  if (!shopId) return NextResponse.json({ success: false, message: "shopId required" }, { status: 400 });

  // Get cached forecasts first
  const cached = await prisma.forecast.findMany({
    where: {
      shopId,
      forecastDate: { gte: new Date() },
    },
    orderBy: { forecastDate: "asc" },
    take: 30,
  });

  if (cached.length > 0) {
    return NextResponse.json({ success: true, data: cached, source: "cache" });
  }

  // Forward to FastAPI if available
  const fastapiUrl = process.env.FASTAPI_URL;
  if (fastapiUrl) {
    try {
      const res = await fetch(`${fastapiUrl}/forecast/${shopId}`, {
        headers: { "X-API-Key": process.env.FASTAPI_SECRET_KEY ?? "" },
      });
      if (res.ok) {
        const forecasts = await res.json();
        return NextResponse.json({ success: true, data: forecasts, source: "ai" });
      }
    } catch {
      // Fall through to simple forecast
    }
  }

  // Fallback: simple moving average from historical data
  const historicalBookings = await prisma.booking.groupBy({
    by: ["scheduledAt"],
    where: {
      shopId,
      status: { in: ["COMPLETED", "CONFIRMED"] },
      scheduledAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    },
    _count: true,
    orderBy: { scheduledAt: "asc" },
  });

  // Group by day of week to find patterns
  const byDayOfWeek = Array(7).fill(0).map(() => ({ count: 0, days: 0 }));
  historicalBookings.forEach((b) => {
    const dow = new Date(b.scheduledAt).getDay();
    byDayOfWeek[dow].count += b._count;
    byDayOfWeek[dow].days += 1;
  });

  // Generate 7-day forecast
  const forecasts = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    const dow = date.getDay();
    const avg = byDayOfWeek[dow].days > 0
      ? byDayOfWeek[dow].count / byDayOfWeek[dow].days
      : 5;

    forecasts.push({
      date: date.toISOString().split("T")[0],
      predictedBookings: Math.round(avg),
      predictedRevenue: Math.round(avg * 45),
      confidence: byDayOfWeek[dow].days > 4 ? 0.8 : 0.5,
      dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow],
    });
  }

  return NextResponse.json({ success: true, data: forecasts, source: "fallback" });
}
