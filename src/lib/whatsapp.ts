const WA_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

type TemplateParam = { type: "text"; text: string };

async function sendWhatsApp(to: string, template: string, params: TemplateParam[]) {
  const phone = to.replace(/^\+/, "").replace(/\s/g, "");

  const res = await fetch(WA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: template,
        language: { code: "en" },
        components: params.length
          ? [{ type: "body", parameters: params }]
          : [],
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`WhatsApp send failed: ${JSON.stringify(err)}`);
  }

  return res.json();
}

export const whatsapp = {
  bookingConfirmation: (phone: string, customerName: string, shopName: string, date: string, time: string, barberName: string) =>
    sendWhatsApp(phone, "booking_confirmation", [
      { type: "text", text: customerName },
      { type: "text", text: shopName },
      { type: "text", text: date },
      { type: "text", text: time },
      { type: "text", text: barberName },
    ]),

  depositConfirmation: (phone: string, customerName: string, amount: string, reference: string) =>
    sendWhatsApp(phone, "deposit_confirmation", [
      { type: "text", text: customerName },
      { type: "text", text: amount },
      { type: "text", text: reference },
    ]),

  reminder2Hours: (phone: string, customerName: string, shopName: string, time: string) =>
    sendWhatsApp(phone, "booking_reminder_2hr", [
      { type: "text", text: customerName },
      { type: "text", text: shopName },
      { type: "text", text: time },
    ]),

  reminder15Min: (phone: string, customerName: string, shopName: string) =>
    sendWhatsApp(phone, "booking_reminder_15min", [
      { type: "text", text: customerName },
      { type: "text", text: shopName },
    ]),

  queueCalled: (phone: string, customerName: string, queueNumber: number) =>
    sendWhatsApp(phone, "queue_called", [
      { type: "text", text: customerName },
      { type: "text", text: queueNumber.toString() },
    ]),

  loyaltyReward: (phone: string, customerName: string, rewardName: string) =>
    sendWhatsApp(phone, "loyalty_reward_earned", [
      { type: "text", text: customerName },
      { type: "text", text: rewardName },
    ]),

  cancellationConfirm: (phone: string, customerName: string, shopName: string) =>
    sendWhatsApp(phone, "booking_cancelled", [
      { type: "text", text: customerName },
      { type: "text", text: shopName },
    ]),
};

// Persist notification to DB
import { prisma } from "./prisma";

export async function sendAndLogNotification({
  userId,
  shopId,
  bookingId,
  type,
  title,
  body,
  phone,
  templateFn,
}: {
  userId: string;
  shopId?: string;
  bookingId?: string;
  type: string;
  title: string;
  body: string;
  phone: string;
  templateFn: () => Promise<unknown>;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      shopId,
      bookingId,
      channel: "WHATSAPP",
      type,
      title,
      body,
      status: "PENDING",
    },
  });

  try {
    await templateFn();
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (err) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "FAILED",
        failReason: err instanceof Error ? err.message : "Unknown",
        retryCount: { increment: 1 },
      },
    });
  }

  return notification;
}
