import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, normalizePhone } from "@/lib/auth";
import { verifyOTPSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = verifyOTPSchema.parse(body);
    const normalizedPhone = normalizePhone(phone);

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone, isActive: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        userId: user.id,
        code: otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP" }, { status: 401 });
    }

    // Mark OTP as used
    await prisma.oTPCode.update({ where: { id: otpRecord.id }, data: { used: true } });

    const payload = { sub: user.id, phone: user.phone, role: user.role as "CUSTOMER" | "BARBER" | "OWNER" | "ADMIN" };
    const accessToken = signAccessToken(payload);
    const refreshTokenStr = signRefreshToken({ sub: user.id });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenStr,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Check if new user (no name set yet)
    const isNewUser = user.name === "New User";

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken: refreshTokenStr,
      isNewUser,
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
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ success: false, message: "Invalid input" }, { status: 400 });
    }
    console.error("[verify-otp]", error);
    return NextResponse.json({ success: false, message: "Verification failed" }, { status: 500 });
  }
}
