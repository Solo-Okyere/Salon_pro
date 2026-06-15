import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  if (!userId || !["OWNER", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { bio, specialties, isAvailable, schedule } = body;

  const barber = await prisma.barber.update({
    where: { id },
    data: { bio, specialties, isAvailable },
  });

  if (schedule && Array.isArray(schedule)) {
    for (const s of schedule) {
      await prisma.staffSchedule.upsert({
        where: { barberId_dayOfWeek: { barberId: id, dayOfWeek: s.dayOfWeek } },
        update: { startTime: s.startTime, endTime: s.endTime, isWorking: s.isWorking },
        create: { barberId: id, shopId: barber.shopId, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, isWorking: s.isWorking },
      });
    }
  }

  return NextResponse.json({ data: barber });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  if (!userId || !["OWNER", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.barber.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ message: "Staff member deactivated" });
}
