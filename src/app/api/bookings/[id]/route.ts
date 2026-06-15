import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id, deletedAt: null },
    include: {
      customer: { select: { id: true, name: true, phone: true, avatar: true } },
      barber: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      service: true,
      shop: true,
      payments: true,
    },
  });

  if (!booking) return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: booking });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, scheduledAt, notes } = body;

  const booking = await prisma.booking.findUnique({ where: { id, deletedAt: null } });
  if (!booking) return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });

  // Permission check
  if (user.role === "CUSTOMER" && booking.customerId !== user.id) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      ...(notes !== undefined && { notes }),
      ...(status === "CANCELLED" && { cancelledAt: new Date() }),
      ...(status === "COMPLETED" && { completedAt: new Date() }),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      barber: { include: { user: { select: { id: true, name: true } } } },
      service: true,
      shop: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const booking = await prisma.booking.findUnique({ where: { id, deletedAt: null } });
  if (!booking) return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });

  if (user.role === "CUSTOMER" && booking.customerId !== user.id) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  await prisma.booking.update({
    where: { id },
    data: { deletedAt: new Date(), status: "CANCELLED", cancelledAt: new Date() },
  });

  return NextResponse.json({ success: true, message: "Booking cancelled" });
}
