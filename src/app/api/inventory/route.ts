import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  if (!userId || !["OWNER", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const shop = await prisma.shop.findFirst({ where: { ownerId: userId, deletedAt: null } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const items = await prisma.inventoryItem.findMany({
    where: { shopId: shop.id, isActive: true },
    include: {
      supplier: { select: { id: true, name: true } },
      movements: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: items });
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
  const { name, category, unit, currentStock, minimumStock, costPerUnit, supplierId } = body;

  if (!name || !category) {
    return NextResponse.json({ error: "Name and category required" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.create({
    data: {
      shopId: shop.id,
      name,
      category,
      unit: unit ?? "PIECE",
      currentStock: currentStock ?? 0,
      minimumStock: minimumStock ?? 5,
      costPerUnit,
      supplierId,
    },
  });

  if (currentStock > 0) {
    await prisma.inventoryMovement.create({
      data: { itemId: item.id, type: "IN", quantity: currentStock, notes: "Initial stock", createdById: userId },
    });
  }

  return NextResponse.json({ data: item }, { status: 201 });
}
