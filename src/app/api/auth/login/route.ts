import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, normalizePhone, verifyPassword } from "@/lib/auth";
import { passwordLoginSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password } = passwordLoginSchema.parse(body);
    const normalizedPhone = normalizePhone(phone);

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone, isActive: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ success: false, message: "Invalid phone or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ success: false, message: "Invalid phone or password" }, { status: 401 });
    }

    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role as "CUSTOMER" | "BARBER" | "OWNER" | "ADMIN",
    };
    const accessToken = signAccessToken(payload);
    const refreshTokenStr = signRefreshToken({ sub: user.id });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenStr,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const res = NextResponse.json({
      success: true,
      accessToken,
      refreshToken: refreshTokenStr,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });

    res.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return res;
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === "ZodError" || error.constructor?.name === "ZodError")) {
      return NextResponse.json({ success: false, message: "Invalid phone number or password format" }, { status: 400 });
    }
    console.error("[auth/login]", error);
    return NextResponse.json({ success: false, message: "Login failed" }, { status: 500 });
  }
}
