import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");
  const barberId = searchParams.get("barberId");
  const dateStr = searchParams.get("date");

  if (!shopId || !barberId || !dateStr) {
    return NextResponse.json({ success: false, message: "shopId, barberId, date required" }, { status: 400 });
  }

  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();

  const [shop, schedule, service] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId } }),
    prisma.staffSchedule.findFirst({ where: { barberId, dayOfWeek, isWorking: true } }),
    prisma.service.findFirst({ where: { shopId, isActive: true }, orderBy: { durationMinutes: "asc" } }),
  ]);

  if (!shop || !schedule || !service) {
    return NextResponse.json({ success: true, data: [] });
  }

  // Build slots
  const [openH, openM] = schedule.startTime.split(":").map(Number);
  const [closeH, closeM] = schedule.endTime.split(":").map(Number);
  const slotDuration = service.durationMinutes;

  const startMinutes = openH * 60 + openM;
  const endMinutes = closeH * 60 + closeM;

  // Get existing bookings for the day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existingBookings = await prisma.booking.findMany({
    where: {
      barberId,
      deletedAt: null,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      scheduledAt: { gte: dayStart, lte: dayEnd },
    },
    include: { service: { select: { durationMinutes: true } } },
  });

  const now = new Date();
  const slots: { time: string; available: boolean }[] = [];

  for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
    const slotDate = new Date(date);
    slotDate.setHours(Math.floor(m / 60), m % 60, 0, 0);

    // Skip past slots
    if (slotDate <= now) continue;

    const slotEnd = new Date(slotDate.getTime() + slotDuration * 60 * 1000);
    const isBooked = existingBookings.some((b: { scheduledAt: Date; service: { durationMinutes: number } }) => {
      const bEnd = new Date(b.scheduledAt.getTime() + b.service.durationMinutes * 60 * 1000);
      return b.scheduledAt < slotEnd && bEnd > slotDate;
    });

    const hour = Math.floor(m / 60);
    const min = m % 60;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const time = `${displayHour}:${min.toString().padStart(2, "0")} ${ampm}`;

    slots.push({ time, available: !isBooked });
  }

  return NextResponse.json({ success: true, data: slots });
}
