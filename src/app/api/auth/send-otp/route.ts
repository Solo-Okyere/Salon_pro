import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, normalizePhone } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { sendAndLogNotification } from "@/lib/notifications";
import { sms } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = loginSchema.parse(body);
    const normalizedPhone = normalizePhone(phone);

    // Upsert user
    const user = await prisma.user.upsert({
      where: { phone: normalizedPhone },
      update: {},
      create: { phone: normalizedPhone, name: "New User" },
    });

    // Rate limit: max 5 OTPs per hour per phone
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.oTPCode.count({
      where: { userId: user.id, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= 5) {
      return NextResponse.json(
        { success: false, message: "Too many OTP requests. Try again in an hour." },
        { status: 429 }
      );
    }

    // Invalidate old OTPs
    await prisma.oTPCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Create new OTP (expires in 10 min)
    const code = generateOTP();
    await prisma.oTPCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendAndLogNotification({
      userId: user.id,
      channel: "SMS",
      type: "OTP",
      title: "Login code",
      body: `Your SalonPro verification code is ${code}.`,
      templateFn: () => sms.otpCode(normalizedPhone, code),
    });

    // In dev, also return OTP in response as a fallback when Moolre isn't configured yet
    const devPayload = process.env.NODE_ENV === "development" ? { otp: code } : {};

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      ...devPayload,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ success: false, message: "Invalid phone number" }, { status: 400 });
    }
    console.error("[send-otp]", error);
    return NextResponse.json({ success: false, message: "Failed to send OTP" }, { status: 500 });
  }
}
