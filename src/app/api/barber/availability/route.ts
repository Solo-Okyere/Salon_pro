import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = await getUserFromToken(token ?? "");
    if (!user || !["BARBER", "OWNER", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { isAvailable } = await req.json();

    // Guard: the user must have a barber profile
    const existing = await prisma.barber.findUnique({ where: { userId: user.id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Barber profile not found" }, { status: 404 });
    }

    const barber = await prisma.barber.update({
      where: { userId: user.id },
      data: { isAvailable },
      select: { id: true, isAvailable: true },
    });

    return NextResponse.json({ success: true, data: barber });
  } catch (err) {
    console.error("[PATCH /barber/availability]", err);
    return NextResponse.json({ success: false, message: "Failed to update availability" }, { status: 500 });
  }
}
