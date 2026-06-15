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
  const { type, quantity, notes, name, category, minimumStock, costPerUnit } = body;

  if (type && quantity) {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const newStock = type === "IN"
      ? item.currentStock + quantity
      : type === "OUT"
        ? Math.max(0, item.currentStock - quantity)
        : quantity;

    const [updated] = await prisma.$transaction([
      prisma.inventoryItem.update({ where: { id }, data: { currentStock: newStock } }),
      prisma.inventoryMovement.create({ data: { itemId: id, type, quantity, notes, createdById: userId } }),
    ]);
    return NextResponse.json({ data: updated });
  }

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: { name, category, minimumStock, costPerUnit },
  });
  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  if (!userId || !["OWNER", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.inventoryItem.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ message: "Item removed" });
}
