import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { z } from "zod";

const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = reviewSchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      select: { customerId: true, shopId: true, barberId: true, status: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }
    if (booking.customerId !== user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    if (booking.status !== "COMPLETED") {
      return NextResponse.json({ success: false, message: "Can only review completed bookings" }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({ where: { bookingId: data.bookingId } });
    if (existing) {
      return NextResponse.json({ success: false, message: "Already reviewed this booking" }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: {
        customerId: user.id,
        shopId: booking.shopId,
        barberId: booking.barberId,
        bookingId: data.bookingId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    // Update barber's average rating
    const allReviews = await prisma.review.aggregate({
      where: { barberId: booking.barberId },
      _avg: { rating: true },
      _count: { id: true },
    });
    await prisma.barber.update({
      where: { id: booking.barberId },
      data: {
        rating: allReviews._avg.rating ?? data.rating,
        totalReviews: allReviews._count.id,
      },
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: err.flatten().fieldErrors }, { status: 400 });
    }
    console.error("[POST /reviews]", err);
    return NextResponse.json({ success: false, message: "Failed to submit review" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");
  const barberId = searchParams.get("barberId");

  if (!shopId && !barberId) {
    return NextResponse.json({ success: false, message: "shopId or barberId required" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { ...(shopId ? { shopId } : {}), ...(barberId ? { barberId } : {}) },
    include: {
      customer: { select: { name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ success: true, data: reviews });
}
