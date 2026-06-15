import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { refreshToken } = await req.json().catch(() => ({}));

    if (token) {
      const user = await getUserFromToken(token);
      if (user && refreshToken) {
        await prisma.refreshToken.deleteMany({
          where: { userId: user.id, token: refreshToken },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Logged out" });
  } catch {
    return NextResponse.json({ success: true, message: "Logged out" });
  }
}
