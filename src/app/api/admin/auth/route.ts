import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "your-super-secret-jwt-key-change-in-production"
);

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  const expected = process.env.SUPER_ADMIN_ACCESS_CODE;
  if (!expected) {
    return NextResponse.json({ error: "Admin access not configured" }, { status: 503 });
  }
  if (!code || code !== expected) {
    return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
  }

  const token = await new SignJWT({ sub: "super-admin", role: "ADMIN", phone: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);

  // Return the synthetic admin user + token so the client can populate the auth store
  const adminUser = {
    id: "super-admin",
    name: "Super Admin",
    phone: "admin",
    role: "ADMIN" as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const res = NextResponse.json({ success: true, user: adminUser, accessToken: token });
  res.cookies.set("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete("access_token");
  return res;
}
