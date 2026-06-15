import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ChurnRiskCustomer {
  id: string;
  name: string;
  phone: string;
  lastVisitDays: number;
  totalVisits: number;
  totalSpent: number;
  tier: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  if (!userId || !["OWNER", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const shop = await prisma.shop.findFirst({ where: { ownerId: userId, deletedAt: null } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Get all customers with loyalty accounts (visited at least once)
  const loyaltyAccounts = await prisma.loyaltyAccount.findMany({
    where: { shopId: shop.id },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
    },
  });

  // Get last booking for each customer
  const customerIds = loyaltyAccounts.map((a) => a.customerId);
  const lastBookings = await prisma.booking.findMany({
    where: {
      shopId: shop.id,
      customerId: { in: customerIds },
      status: "COMPLETED",
    },
    orderBy: { scheduledAt: "desc" },
    distinct: ["customerId"],
    select: { customerId: true, scheduledAt: true },
  });

  const lastBookingMap = new Map(lastBookings.map((b) => [b.customerId, b.scheduledAt]));
  const now = new Date();

  const customers: ChurnRiskCustomer[] = loyaltyAccounts
    .map((account) => {
      const lastVisit = lastBookingMap.get(account.customerId);
      const lastVisitDays = lastVisit
        ? Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Risk scoring: 0-100
      let riskScore = 0;
      if (lastVisitDays > 90) riskScore += 50;
      else if (lastVisitDays > 60) riskScore += 35;
      else if (lastVisitDays > 30) riskScore += 20;
      else riskScore += 5;

      // Fewer total visits = higher risk
      if (account.totalVisits < 3) riskScore += 25;
      else if (account.totalVisits < 10) riskScore += 10;

      // Lower tier = higher risk
      const tierBonus = { BRONZE: 15, SILVER: 8, GOLD: 3, PLATINUM: 0 };
      riskScore += tierBonus[account.tier as keyof typeof tierBonus] ?? 15;

      riskScore = Math.min(100, riskScore);

      const riskLevel: ChurnRiskCustomer["riskLevel"] =
        riskScore >= 75 ? "CRITICAL" :
          riskScore >= 55 ? "HIGH" :
            riskScore >= 35 ? "MEDIUM" : "LOW";

      return {
        id: account.customerId,
        name: account.customer.name,
        phone: account.customer.phone,
        lastVisitDays,
        totalVisits: account.totalVisits,
        totalSpent: account.totalSpent,
        tier: account.tier,
        riskScore,
        riskLevel,
      };
    })
    .filter((c) => c.riskLevel !== "LOW")
    .sort((a, b) => b.riskScore - a.riskScore);

  // High-value customers (top 20% by spend) recently inactive
  const highValueThreshold = loyaltyAccounts.length > 0
    ? loyaltyAccounts.sort((a, b) => b.totalSpent - a.totalSpent)[Math.floor(loyaltyAccounts.length * 0.2)]?.totalSpent ?? 0
    : 0;

  const highValue = customers.filter((c) => c.totalSpent >= highValueThreshold && c.lastVisitDays > 20);

  // Insights
  const insights = [
    {
      type: "CHURN_RISK",
      title: `${customers.filter((c) => c.riskLevel === "CRITICAL").length} customers at critical churn risk`,
      body: "These customers haven't visited in 90+ days. Send a win-back offer now.",
      priority: "HIGH",
    },
    {
      type: "HIGH_VALUE",
      title: `${highValue.length} high-value customers showing inactivity`,
      body: `Your top spenders are becoming inactive. Offer them a loyalty reward to bring them back.`,
      priority: "MEDIUM",
    },
    {
      type: "RETENTION",
      title: "Best retention window: 14-21 days after last visit",
      body: "Research shows customers are most likely to respond to re-engagement within 3 weeks of their last visit.",
      priority: "LOW",
    },
  ].filter((i) => {
    if (i.type === "CHURN_RISK" && customers.filter((c) => c.riskLevel === "CRITICAL").length === 0) return false;
    if (i.type === "HIGH_VALUE" && highValue.length === 0) return false;
    return true;
  });

  return NextResponse.json({
    data: {
      atRisk: customers,
      highValue,
      insights,
      summary: {
        totalAtRisk: customers.length,
        critical: customers.filter((c) => c.riskLevel === "CRITICAL").length,
        high: customers.filter((c) => c.riskLevel === "HIGH").length,
        medium: customers.filter((c) => c.riskLevel === "MEDIUM").length,
      },
    },
  });
}
