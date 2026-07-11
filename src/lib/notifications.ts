import { prisma } from "./prisma";
import type { NotificationChannel } from "@prisma/client";

export async function sendAndLogNotification({
  userId,
  shopId,
  bookingId,
  channel,
  type,
  title,
  body,
  templateFn,
}: {
  userId: string;
  shopId?: string;
  bookingId?: string;
  channel: NotificationChannel;
  type: string;
  title: string;
  body: string;
  templateFn: () => Promise<unknown>;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      shopId,
      bookingId,
      channel,
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
