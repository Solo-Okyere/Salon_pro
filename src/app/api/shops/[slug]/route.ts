import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug, isActive: true },
    include: {
      owner: { select: { id: true, name: true, phone: true } },
      barbers: {
        where: { isActive: true },
        include: {
          user: { select: { id: true, name: true, avatar: true, phone: true } },
          _count: { select: { reviews: true } },
        },
      },
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { id: true, name: true, avatar: true } } },
      },
      _count: { select: { reviews: true, bookings: true } },
    },
  });

  if (!shop) return NextResponse.json({ success: false, message: "Shop not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: shop });
}
