import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { moolre } from "@/lib/moolre";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getUserFromToken(token ?? "");
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const balanceResult = await moolre.checkAccountStatus();
    const balance = Number(balanceResult.data?.balance ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        balance,
        accountName: balanceResult.data?.accountname ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load wallet balance";
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
