"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, Users, Calendar, DollarSign,
  AlertTriangle, Clock, Scissors, Star, Sparkles,
  ArrowRight, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import api, { paymentsAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/slices/authSlice";
import { MetricCard } from "@/components/ui/MetricCard";

type Period = "day" | "week" | "month";

interface DashData {
  shop: { id: string; name: string; city: string };
  period: string;
  metrics: {
    totalBookings: number;
    completedBookings: number;
    noShows: number;
    noShowRate: number;
    completionRate: number;
    totalRevenue: number;
    uniqueCustomers: number;
    queueToday: number;
    trends: {
      revenue: string; revenueUp: boolean;
      bookings: string; bookingsUp: boolean;
      customers: string; customersUp: boolean;
      noShowRate: string; noShowRateUp: boolean;
    };
  };
  weeklyRevenue: number[];
  bestDay: string;
  topBarbers: Array<{
    id: string; rating: number;
    user: { name: string };
    _count: { bookings: number };
  }>;
  recentBookings: Array<{
    id: string; scheduledAt: string; status: string; totalAmount: number;
    customer: { name: string };
    barber: { user: { name: string } };
    service: { name: string };
  }>;
}

// ── Status map ────────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; cls: string }> = {
  COMPLETED:   { label: "Completed",   cls: "badge badge-green" },
  CONFIRMED:   { label: "Confirmed",   cls: "badge badge-blue" },
  PENDING:     { label: "Pending",     cls: "badge badge-yellow" },
  CANCELLED:   { label: "Cancelled",   cls: "badge badge-red" },
  NO_SHOW:     { label: "No-show",     cls: "badge badge-orange" },
  IN_PROGRESS: { label: "In progress", cls: "badge badge-gold" },
};

// ── Bar chart ─────────────────────────────────────────────────────────────────
function WeekChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <div className="flex items-end gap-2 h-20">
      {data.map((v, i) => {
        const pct = (v / max) * 100;
        const isToday = i === todayIdx;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div className="relative w-full flex items-end" style={{ height: "56px" }}>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap bg-foreground text-background text-xs px-2 py-1 rounded shadow">
                GHS {v.toLocaleString()}
              </div>
              <motion.div
                className="w-full rounded-t"
                style={{ background: isToday ? "#d4a017" : "#e2e8f0" }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pct, 3)}%` }}
                transition={{ delay: i * 0.05 + 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
              />
            </div>
            <span className={cn(
              "text-[10px] font-medium",
              isToday ? "text-primary" : "text-muted-foreground"
            )}>
              {days[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<Period>("week");
  const [now, setNow] = useState(new Date());
  const [payoutForm, setPayoutForm] = useState({
    name: "",
    phoneNumber: "+233",
    amount: "",
    network: "MTN" as "MTN" | "TELECEL" | "AT",
  });
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useQuery<{ data: DashData }>({
    queryKey: ["owner-dash", period],
    queryFn: () => api.get(`/api/dashboard/owner?period=${period}`).then(r => r.data),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const d = data?.data;
  const hour = now.getHours();

  useEffect(() => {
    const loadBalance = async () => {
      setIsLoadingBalance(true);
      try {
        const response = await paymentsAPI.balance();
        setWalletBalance(Number(response.data?.data?.balance ?? 0));
      } catch {
        setWalletBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    loadBalance();
  }, []);
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const metrics = d ? [
    {
      label: "Revenue",       rawValue: d.metrics.totalRevenue,    prefix: "GHS ",
      trend: d.metrics.trends.revenue, trendUp: d.metrics.trends.revenueUp,
      trendSub: `vs last ${period}`,
      iconBg: "bg-amber-500/15",   iconColor: "#f59e0b", icon: DollarSign,
    },
    {
      label: "Bookings",      rawValue: d.metrics.totalBookings,
      trend: d.metrics.trends.bookings, trendUp: d.metrics.trends.bookingsUp,
      trendSub: `${d.metrics.completedBookings} completed`,
      iconBg: "bg-blue-500/15",    iconColor: "#60a5fa", icon: Calendar,
    },
    {
      label: "Customers",     rawValue: d.metrics.uniqueCustomers,
      trend: d.metrics.trends.customers, trendUp: d.metrics.trends.customersUp,
      trendSub: "unique visitors",
      iconBg: "bg-violet-500/15",  iconColor: "#a78bfa", icon: Users,
    },
    {
      label: "No-show rate",  rawValue: d.metrics.noShowRate,  suffix: "%",
      trend: d.metrics.trends.noShowRate, trendUp: d.metrics.trends.noShowRateUp,
      trendSub: `${d.metrics.noShows} missed`,
      iconBg: d.metrics.noShowRate > 15 ? "bg-red-500/15" : "bg-emerald-500/15",
      iconColor: d.metrics.noShowRate > 15 ? "#f87171" : "#34d399",
      icon: AlertTriangle,
    },
  ] : [];

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPayout(true);

    try {
      const amount = Number(payoutForm.amount);
      if (!payoutForm.name.trim() || !payoutForm.phoneNumber.trim() || Number.isNaN(amount) || amount <= 0) {
        toast.error("Please fill in a valid recipient name, phone number, and amount.");
        return;
      }

      const response = await paymentsAPI.disburse({
        recipients: [{
          name: payoutForm.name.trim(),
          phoneNumber: payoutForm.phoneNumber.trim(),
          amount,
          network: payoutForm.network,
        }],
        currency: "GHS",
        reference: `OWNER-PAYOUT-${Date.now()}`,
      });

      toast.success(response.data?.message ?? "Payout request submitted successfully.");
      setPayoutForm({ name: "", phoneNumber: "+233", amount: "", network: "MTN" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to submit payout request.";
      toast.error(message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
            <span>{d?.shop.name ?? "Loading..."}</span>
            {d?.shop.city && <><span>·</span><span>{d.shop.city}</span></>}
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              <span>Live</span>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-outline flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm disabled:opacity-60"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
            Refresh
          </button>
          <div className="flex rounded-lg border border-white/[0.08] overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            {(["day", "week", "month"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  period === p
                    ? "bg-primary text-black"
                    : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="metric-card space-y-3">
                <div className="skeleton h-9 w-9 rounded-lg" />
                <div className="skeleton h-7 w-24" />
                <div className="skeleton h-4 w-20" />
              </div>
            ))
          : metrics.map((m, i) => <MetricCard key={m.label} {...m} delay={i * 0.06} />)
        }
      </div>

      {/* Payout action */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="glass-card p-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Send a payout</h2>
            <p className="text-sm text-muted-foreground">Validate the recipient and disburse funds from your Moolre wallet.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <DollarSign className="h-3.5 w-3.5" />
            {isLoadingBalance ? "Checking wallet..." : `Wallet: GHS ${walletBalance ?? "—"}`}
          </div>
        </div>

        <form onSubmit={handlePayoutSubmit} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground">Recipient name</label>
            <input
              value={payoutForm.name}
              onChange={(e) => setPayoutForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground"
              placeholder="e.g. Ama Mensah"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Phone number</label>
            <input
              value={payoutForm.phoneNumber}
              onChange={(e) => setPayoutForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground"
              placeholder="+233241234567"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Network</label>
            <select
              value={payoutForm.network}
              onChange={(e) => setPayoutForm((prev) => ({ ...prev, network: e.target.value as "MTN" | "TELECEL" | "AT" }))}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none"
            >
              <option value="MTN">MTN</option>
              <option value="TELECEL">Telecel</option>
              <option value="AT">AT</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Amount (GHS)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={payoutForm.amount}
              onChange={(e) => setPayoutForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none ring-0"
              placeholder="10.00"
              required
            />
          </div>

          <div className="md:col-span-2 xl:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={isSubmittingPayout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmittingPayout ? "Sending..." : "Send payout"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </motion.div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="lg:col-span-2 glass-card p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-foreground">Weekly revenue</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Mon – Sun breakdown</p>
            </div>
            <span className={cn(
              "flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full border",
              d?.metrics.trends.revenueUp
                ? "text-green-400 bg-green-500/15 border-green-500/25"
                : "text-red-400 bg-red-500/15 border-red-500/25"
            )}>
              {d?.metrics.trends.revenueUp
                ? <TrendingUp className="w-3.5 h-3.5" />
                : <TrendingDown className="w-3.5 h-3.5" />}
              {d?.metrics.trends.revenue ?? "—"} vs last week
            </span>
          </div>

          {isLoading
            ? <div className="skeleton h-20 w-full" />
            : <WeekChart data={d?.weeklyRevenue ?? [0, 0, 0, 0, 0, 0, 0]} />
          }

          <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Total",    value: d ? formatCurrency(d.metrics.totalRevenue) : "—" },
              { label: "Per day",  value: d ? `GHS ${Math.round(d.metrics.totalRevenue / 7)}` : "—" },
              { label: "Best day", value: d?.bestDay ?? "—" },
            ].map(s => (
              <div key={s.label}>
                <p className="font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
          className="bg-card border border-border rounded-xl p-5 shadow-card flex flex-col gap-4"
        >
          <h2 className="font-semibold text-foreground">Today</h2>

          <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{d?.metrics.queueToday ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">In queue now</p>
            </div>
          </div>

          <div className="space-y-3">
            {d && [
              { label: "Completion",  value: d.metrics.completionRate, color: "#22c55e" },
              { label: "Capacity",    value: Math.min(Math.round((d.metrics.totalBookings / 30) * 100), 100), color: "#d4a017" },
            ].map(bar => (
              <div key={bar.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{bar.label}</span>
                  <span className="font-semibold text-foreground">{bar.value}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: bar.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.value}%` }}
                    transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border mt-auto">
            <Link href="/ai" className="flex items-center justify-between text-sm font-medium text-foreground group">
              <span className="flex items-center gap-1.5 text-primary">
                <Sparkles className="w-3.5 h-3.5" /> AI Insights
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Bookings table + barbers */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent bookings</h2>
            <Link href="/staff" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Barber</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {d?.recentBookings.length ? d.recentBookings.map((b, i) => (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 + 0.45 }}
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                            {b.customer.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium">{b.customer.name}</span>
                        </div>
                      </td>
                      <td className="text-muted-foreground">{b.service.name}</td>
                      <td className="text-muted-foreground">{b.barber.user.name}</td>
                      <td className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(b.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td><span className={STATUS[b.status]?.cls ?? "badge badge-gray"}>{STATUS[b.status]?.label ?? b.status}</span></td>
                      <td className="text-right font-semibold">{b.totalAmount > 0 ? `GHS ${b.totalAmount}` : "—"}</td>
                    </motion.tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                        No bookings for this period yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Top barbers */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Top barbers</h2>
            <Link href="/staff" className="text-sm text-primary font-medium hover:underline">Manage</Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-3"><div className="skeleton h-8 w-full" /></div>
                ))
              : d?.topBarbers.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/40 transition-colors">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      i === 0 ? "bg-amber-400 text-black" : i === 1 ? "bg-slate-300 text-slate-700" : "bg-amber-100 text-amber-800"
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{b.user.name}</p>
                      <p className="text-xs text-muted-foreground">{b._count.bookings} bookings</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {b.rating.toFixed(1)}
                    </div>
                  </div>
                ))
            }
            {!isLoading && !d?.topBarbers.length && (
              <p className="px-5 py-8 text-sm text-center text-muted-foreground">No barbers added yet.</p>
            )}
          </div>
          <div className="px-5 py-3 border-t border-border">
            <Link href="/staff" className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline py-1">
              <Scissors className="w-3.5 h-3.5" /> Add barber
            </Link>
          </div>
        </motion.div>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        Last updated {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"} · auto-refreshes every 30s
      </p>
    </div>
  );
}
