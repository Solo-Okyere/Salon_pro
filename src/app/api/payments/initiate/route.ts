import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { paymentSchema } from "@/lib/validators";
import { z } from "zod";

// MTN MoMo payment initiation
async function initiateMTNMoMo(amount: number, phone: string, reference: string) {
  const baseUrl = process.env.MTN_MOMO_BASE_URL!;
  const subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY!;
  const apiUser = process.env.MTN_MOMO_API_USER!;
  const apiKey = process.env.MTN_MOMO_API_KEY!;

  const credentials = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");
  const tokenRes = await fetch(`${baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
    },
  });

  if (!tokenRes.ok) throw new Error("Failed to get MTN token");
  const { access_token } = await tokenRes.json();

  const payRes = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "X-Reference-Id": reference,
      "X-Target-Environment": "sandbox",
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: "GHS",
      externalId: reference,
      payer: { partyIdType: "MSISDN", partyId: phone.replace("+", "") },
      payerMessage: "SalonPro booking payment",
      payeeNote: "Booking deposit",
    }),
  });

  if (payRes.status !== 202) throw new Error("MTN MoMo request failed");
  return reference;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = paymentSchema.parse(body);

    // Resolve shopId from booking to avoid trusting client input
    let shopId: string | null = null;
    if (data.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        select: { shopId: true, customerId: true },
      });
      if (!booking) {
        return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
      }
      if (booking.customerId !== user.id) {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      }
      shopId = booking.shopId;
    }

    const reference = `SP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const payment = await prisma.payment.create({
      data: {
        customerId: user.id,
        shopId: shopId ?? "",
        bookingId: data.bookingId,
        amount: data.amount,
        provider: data.provider,
        phoneNumber: data.phoneNumber,
        reference,
        status: "PENDING",
      },
    });

    // Initiate with provider
    if (data.provider === "MTN_MOMO") {
      await initiateMTNMoMo(data.amount, data.phoneNumber, reference);
    }
    // TODO: Telecel Cash, AT Money integrations

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        reference,
        message: "Payment request sent to your phone. Approve it to complete.",
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid data" }, { status: 400 });
    }
    console.error("[POST /payments/initiate]", err);
    return NextResponse.json({ success: false, message: "Payment initiation failed" }, { status: 500 });
  }
}
