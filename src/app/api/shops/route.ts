import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const shops = await prisma.shop.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      barbers: {
        where: { isActive: true },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      _count: { select: { reviews: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: shops });
}
