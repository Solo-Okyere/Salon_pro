import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const role = req.headers.get("x-user-role");
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const shop = await prisma.shop.update({
    where: { id },
    data: { isActive: false },
    include: { owner: { select: { id: true, name: true, phone: true } }, _count: { select: { bookings: true, barbers: true } } },
  });

  return NextResponse.json({ data: shop });
}
