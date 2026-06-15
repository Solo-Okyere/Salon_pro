import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  if (!userId || !["OWNER", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const shop = await prisma.shop.findFirst({ where: { ownerId: userId, deletedAt: null } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const barbers = await prisma.barber.findMany({
    where: { shopId: shop.id, isActive: true },
    include: {
      user: { select: { id: true, name: true, phone: true, avatar: true } },
      staffSchedules: true,
      performance: {
        where: { shopId: shop.id },
        orderBy: { date: "desc" },
        take: 7,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: barbers });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  if (!userId || !["OWNER", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const shop = await prisma.shop.findFirst({ where: { ownerId: userId, deletedAt: null } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { phone, name, password, bio, specialties, schedule } = body;

  if (!phone || !name) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const normalizedPhone = phone.startsWith("+233") ? phone : `+233${phone.replace(/^0/, "")}`;

  const hashedPassword = await hashPassword(password);

  let user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (!user) {
    user = await prisma.user.create({
      data: { phone: normalizedPhone, name, role: "BARBER", password: hashedPassword },
    });
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { role: "BARBER", password: hashedPassword } });
  }

  const existing = await prisma.barber.findUnique({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "Barber already exists in this shop" }, { status: 409 });
  }

  const barber = await prisma.barber.create({
    data: {
      userId: user.id,
      shopId: shop.id,
      bio,
      specialties: specialties ?? [],
    },
  });

  if (schedule && Array.isArray(schedule)) {
    await prisma.staffSchedule.createMany({
      data: schedule.map((s: { dayOfWeek: number; startTime: string; endTime: string; isWorking: boolean }) => ({
        barberId: barber.id,
        shopId: shop.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isWorking: s.isWorking ?? true,
      })),
    });
  }

  return NextResponse.json({ data: barber }, { status: 201 });
}
