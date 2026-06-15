import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";

const createServiceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  depositAmount: z.number().min(0).default(0),
  durationMinutes: z.number().int().min(5).max(480),
  imageUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");

  if (!shopId) return NextResponse.json({ success: false, message: "shopId required" }, { status: 400 });

  const services = await prisma.service.findMany({
    where: { shopId, isActive: true, deletedAt: null },
    orderBy: { price: "asc" },
  });

  return NextResponse.json({ success: true, data: services });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createServiceSchema.parse(body);

    const shop = await prisma.shop.findFirst({ where: { ownerId: user.id } });
    if (!shop && user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Shop not found" }, { status: 404 });
    }

    const shopId = body.shopId ?? shop?.id;
    if (!shopId) return NextResponse.json({ success: false, message: "shopId required" }, { status: 400 });

    const service = await prisma.service.create({
      data: { ...data, shopId },
    });

    return NextResponse.json({ success: true, data: service }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: err.flatten().fieldErrors }, { status: 400 });
    }
    console.error("[POST /services]", err);
    return NextResponse.json({ success: false, message: "Failed to create service" }, { status: 500 });
  }
}
