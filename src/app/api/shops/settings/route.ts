import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";

const settingsSchema = z.object({
  name:        z.string().min(2).max(100).optional(),
  phone:       z.string().optional(),
  address:     z.string().min(5).optional(),
  city:        z.string().min(2).optional(),
  region:      z.string().min(2).optional(),
  description: z.string().max(500).optional(),
  openTime:    z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closeTime:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
  email:       z.string().email().optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const shop = await prisma.shop.findFirst({
    where: { ownerId: user.id },
    select: {
      id: true, name: true, slug: true, phone: true, email: true,
      address: true, city: true, region: true, description: true,
      openTime: true, closeTime: true, isActive: true, isVerified: true,
    },
  });

  if (!shop) return NextResponse.json({ success: false, message: "Shop not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: shop });
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = settingsSchema.parse(body);

    const shop = await prisma.shop.findFirst({ where: { ownerId: user.id } });
    if (!shop) return NextResponse.json({ success: false, message: "Shop not found" }, { status: 404 });

    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data,
      select: {
        id: true, name: true, slug: true, phone: true, email: true,
        address: true, city: true, region: true, description: true,
        openTime: true, closeTime: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: err.flatten().fieldErrors }, { status: 400 });
    }
    console.error("[PATCH /shops/settings]", err);
    return NextResponse.json({ success: false, message: "Failed to update shop" }, { status: 500 });
  }
}
