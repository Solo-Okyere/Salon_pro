import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/auth";

// DEV ONLY — auto-login as OWNER for demo/testing
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const role = (req.nextUrl.searchParams.get("role") ?? "OWNER").toUpperCase();
  const phone = role === "BARBER" ? "+233301234567" : role === "CUSTOMER" ? "+233401234567" : "+233201234567";

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({
      data: { phone, name: role === "BARBER" ? "Kwame Barber" : role === "CUSTOMER" ? "Ama Customer" : "Kofi Mensah", role: role as "OWNER" | "BARBER" | "CUSTOMER" | "ADMIN" },
    });
  } else if (user.role !== role as "OWNER" | "BARBER" | "CUSTOMER" | "ADMIN") {
    user = await prisma.user.update({ where: { id: user.id }, data: { role: role as "OWNER" | "BARBER" | "CUSTOMER" | "ADMIN" } });
  }

  if (role === "OWNER") {
    const shopExists = await prisma.shop.findFirst({ where: { ownerId: user.id } });
    if (!shopExists) {
      await prisma.shop.create({
        data: {
          name: "Kofi's Barbershop",
          slug: "kofis-barbershop",
          phone: user.phone,
          address: "45 Osu Oxford Street",
          city: "Accra",
          region: "Greater Accra",
          ownerId: user.id,
          isActive: true,
          isVerified: true,
        },
      });
    }
  }

  const accessToken = signAccessToken({ sub: user.id, phone: user.phone, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  const authState = JSON.stringify({
    state: { user, accessToken, refreshToken, isAuthenticated: true },
    version: 0,
  });

  const redirect = role === "BARBER" ? "/barber" : role === "CUSTOMER" ? "/customer" : "/owner";

  const html = `<!DOCTYPE html>
<html>
<head><title>Logging in...</title></head>
<body>
<script>
  document.cookie = "access_token=${accessToken}; path=/; max-age=900; samesite=lax";
  localStorage.setItem('salonpro-auth', ${JSON.stringify(authState)});
  window.location.replace('${redirect}');
</script>
<p>Redirecting...</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
