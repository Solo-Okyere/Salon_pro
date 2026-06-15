import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { publish } from "@/lib/realtime";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = await getUserFromToken(token ?? "");
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const entry = await prisma.queueEntry.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ success: false, message: "Queue entry not found" }, { status: 404 });

    if (user.role === "CUSTOMER" && entry.customerId !== user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await prisma.queueEntry.update({
      where: { id },
      data: { status: "LEFT", leftAt: new Date() },
    });

    publish(entry.shopId, { type: "queue:update" });
    return NextResponse.json({ success: true, message: "Left queue" });
  } catch (err) {
    console.error("[DELETE /queue/:id]", err);
    return NextResponse.json({ success: false, message: "Failed to leave queue" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = await getUserFromToken(token ?? "");
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { action } = await req.json();

    const statusMap: Record<string, { status: string; field: string }> = {
      call:     { status: "CALLED",     field: "calledAt" },
      start:    { status: "IN_SERVICE", field: "serviceStartedAt" },
      complete: { status: "DONE",       field: "completedAt" },
    };

    const transition = statusMap[action];
    if (!transition) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    const entry = await prisma.queueEntry.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ success: false, message: "Queue entry not found" }, { status: 404 });

    const updated = await prisma.queueEntry.update({
      where: { id },
      data: {
        status: transition.status as "CALLED" | "IN_SERVICE" | "DONE",
        [transition.field]: new Date(),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: true,
      },
    });

    publish(entry.shopId, { type: "queue:update" });
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /queue/:id]", err);
    return NextResponse.json({ success: false, message: "Failed to update queue entry" }, { status: 500 });
  }
}
