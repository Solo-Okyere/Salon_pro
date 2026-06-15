import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, normalizePhone } from "@/lib/auth";
import { queueJoinSchema } from "@/lib/validators";
import { publish } from "@/lib/realtime";
import { z } from "zod";

export async function POST(req: NextRequest) {
  // Auth is optional — guests provide name+phone instead
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const authUser = token ? await getUserFromToken(token) : null;

  try {
    const body = await req.json();
    const data = queueJoinSchema.parse(body);

    // Resolve customerId: logged-in user OR guest find-or-create
    let customerId: string;
    if (authUser) {
      customerId = authUser.id;
    } else {
      if (!data.customerName || !data.customerPhone) {
        return NextResponse.json(
          { success: false, message: "Please provide your name and phone number to join the queue" },
          { status: 400 }
        );
      }
      const guestPhone = normalizePhone(data.customerPhone);
      const existing = await prisma.user.findUnique({ where: { phone: guestPhone } });
      const guestUser = existing
        ? existing
        : await prisma.user.create({
            data: { phone: guestPhone, name: data.customerName, role: "CUSTOMER" },
          });
      customerId = guestUser.id;
    }

    // Check if already in queue
    const alreadyIn = await prisma.queueEntry.findFirst({
      where: {
        shopId: data.shopId,
        customerId,
        status: { in: ["WAITING", "CALLED"] },
      },
    });

    if (alreadyIn) {
      return NextResponse.json({ success: false, message: "You are already in the queue" }, { status: 409 });
    }

    // Get next queue number
    const lastEntry = await prisma.queueEntry.findFirst({
      where: { shopId: data.shopId, joinedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      orderBy: { queueNumber: "desc" },
    });
    const queueNumber = (lastEntry?.queueNumber ?? 0) + 1;

    // Count waiting ahead
    const waitingCount = await prisma.queueEntry.count({
      where: {
        shopId: data.shopId,
        status: "WAITING",
        ...(data.isPremium ? {} : { isPremium: false }),
      },
    });

    // Avg service time (default 30 min)
    const avgService = 30;
    const estimatedWaitMinutes = waitingCount * avgService;

    const entry = await prisma.queueEntry.create({
      data: {
        shopId: data.shopId,
        customerId,
        barberId: data.barberId,
        serviceId: data.serviceId,
        queueNumber,
        isPremium: data.isPremium ?? false,
        estimatedWaitMinutes,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        barber: { include: { user: { select: { id: true, name: true } } } },
        service: true,
        shop: { select: { id: true, name: true, phone: true } },
      },
    });

    // Broadcast to all SSE subscribers for this shop
    publish(data.shopId, { type: "queue:join", entry: { id: entry.id, queueNumber: entry.queueNumber, customer: entry.customer, service: entry.service, isPremium: entry.isPremium } });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid data" }, { status: 400 });
    }
    console.error("[POST /queue/join]", err);
    return NextResponse.json({ success: false, message: "Failed to join queue" }, { status: 500 });
  }
}
