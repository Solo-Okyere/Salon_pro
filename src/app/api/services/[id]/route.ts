import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";

const updateServiceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().positive().optional(),
  depositAmount: z.number().min(0).optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateServiceSchema.parse(body);

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return NextResponse.json({ success: false, message: "Service not found" }, { status: 404 });

    if (user.role !== "ADMIN") {
      const shop = await prisma.shop.findFirst({ where: { id: service.shopId, ownerId: user.id } });
      if (!shop) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.service.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: err.flatten().fieldErrors }, { status: 400 });
    }
    console.error("[PATCH /services/:id]", err);
    return NextResponse.json({ success: false, message: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) return NextResponse.json({ success: false, message: "Service not found" }, { status: 404 });

  if (user.role !== "ADMIN") {
    const shop = await prisma.shop.findFirst({ where: { id: service.shopId, ownerId: user.id } });
    if (!shop) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  await prisma.service.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}
