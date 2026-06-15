import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// GET /api/admin/shops — list all shops with owner + counts
export async function GET(req: NextRequest) {
  const role = req.headers.get("x-user-role");
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const shops = await prisma.shop.findMany({
    include: {
      owner: { select: { id: true, name: true, phone: true } },
      _count: { select: { bookings: true, barbers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: shops });
}

// POST /api/admin/shops — register a new shop (creates owner user if not existing)
export async function POST(req: NextRequest) {
  const role = req.headers.get("x-user-role");
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { ownerName, ownerPhone, ownerPassword, shopName, city, region, address, phone } = body;

  if (!ownerName || !ownerPhone || !shopName || !city || !region || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!ownerPassword || ownerPassword.length < 6) {
    return NextResponse.json({ error: "Owner password must be at least 6 characters" }, { status: 400 });
  }

  // Normalize phone
  const normalizedPhone = ownerPhone.startsWith("+233")
    ? ownerPhone
    : `+233${ownerPhone.replace(/^0/, "")}`;

  const hashedPassword = await hashPassword(ownerPassword);

  // Find or create the owner user
  let owner = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (!owner) {
    owner = await prisma.user.create({
      data: { phone: normalizedPhone, name: ownerName, role: "OWNER", password: hashedPassword },
    });
  } else {
    owner = await prisma.user.update({
      where: { id: owner.id },
      data: { role: "OWNER", name: ownerName, password: hashedPassword },
    });
  }

  // Generate slug
  const baseSlug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.shop.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const shop = await prisma.shop.create({
    data: {
      name: shopName, slug, city, region, address,
      phone: phone || normalizedPhone,
      ownerId: owner.id,
      isActive: true,
      isVerified: false, // requires admin verification
    },
    include: {
      owner: { select: { id: true, name: true, phone: true } },
      _count: { select: { bookings: true, barbers: true } },
    },
  });

  return NextResponse.json({ data: shop }, { status: 201 });
}
