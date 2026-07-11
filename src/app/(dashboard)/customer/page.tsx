"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Star, Gift, Scissors, ChevronRight, Trophy, Zap, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/slices/authSlice";

const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const TIER_COLORS: Record<string, string> = {
  BRONZE: "text-amber-600",
  SILVER: "text-slate-400",
  GOLD: "text-yellow-400",
  PLATINUM: "text-cyan-400",
};

const TIER_BG: Record<string, string> = {
  BRONZE: "bg-amber-600/10 border-amber-600/30",
  SILVER: "bg-slate-400/10 border-slate-400/30",
  GOLD: "bg-yellow-400/10 border-yellow-400/30",
  PLATINUM: "bg-cyan-400/10 border-cyan-400/30",
};

interface LoyaltyData {
  account: {
    points: number;
    totalVisits: number;
    totalSpent: number;
    tier: string;
  } | null;
  rewards: Array<{ id: string; name: string; description: string; pointsCost: number }>;
}

interface BookingItem {
  id: string;
  scheduledAt: string;
  status: string;
  totalAmount: number;
  service: { name: string };
  barber: { user: { name: string } };
  shop: { name: string };
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star className={cn("w-7 h-7", (hover || value) >= s ? "text-[#d4a017] fill-[#d4a017]" : "text-white/40")} />
        </button>
      ))}
    </div>
  );
}

export default function CustomerDashboard() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [reviewBooking, setReviewBooking] = useState<BookingItem | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const reviewMutation = useMutation({
    mutationFn: () => api.post("/api/reviews", { bookingId: reviewBooking!.id, rating, comment }),
    onSuccess: () => {
      toast.success("Review submitted! Thank you.");
      setReviewBooking(null);
      setRating(5);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to submit review";
      toast.error(msg);
    },
  });

  const { data: bookings, isLoading: loadingBookings } = useQuery<BookingItem[]>({
    queryKey: ["customer-bookings"],
    queryFn: () => api.get("/api/bookings").then((r) => r.data.data),
  });

  const { data: loyalty, isLoading: loadingLoyalty } = useQuery<LoyaltyData>({
    queryKey: ["loyalty"],
    queryFn: () => api.get("/api/loyalty").then((r) => r.data),
  });

  const upcoming = bookings?.filter((b) =>
    ["PENDING", "CONFIRMED"].includes(b.status) && new Date(b.scheduledAt) > new Date()
  ) ?? [];

  const past = bookings?.filter((b) =>
    ["COMPLETED", "NO_SHOW", "CANCELLED"].includes(b.status)
  ).slice(0, 5) ?? [];

  const tier = loyalty?.account?.tier ?? "BRONZE";
  const nextTierVisits = { BRONZE: 10, SILVER: 20, GOLD: 50, PLATINUM: Infinity };
  const visitsToNext = Math.max(0, (nextTierVisits[tier as keyof typeof nextTierVisits] || 10) - (loyalty?.account?.totalVisits ?? 0));

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 md:p-8">
      {/* Review modal */}
      <AnimatePresence>
        {reviewBooking && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setReviewBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Rate your visit</h3>
                <button onClick={() => setReviewBooking(null)} className="p-1.5 hover:bg-white/10 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white/60 text-sm mb-5">
                {reviewBooking.service.name} at {reviewBooking.shop.name} · {reviewBooking.barber.user.name}
              </p>
              <div className="mb-4 flex justify-center">
                <StarRating value={rating} onChange={setRating} />
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (optional)..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-[#d4a017]/50 mb-4"
              />
              <button
                onClick={() => reviewMutation.mutate()}
                disabled={reviewMutation.isPending}
                className="w-full bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-60 text-black font-semibold py-3 rounded-xl transition-colors"
              >
                {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fade} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
            <p className="text-white/60 text-sm mt-1">Your barber dashboard</p>
          </div>
          <Link href="/booking"
            className="flex items-center gap-2 bg-[#d4a017] hover:bg-[#b8860b] text-black font-semibold px-4 py-2 rounded-xl transition-colors text-sm">
            <Scissors className="w-4 h-4" />
            Book Now
          </Link>
        </div>

        {/* Loyalty Card */}
        {loyalty?.account && (
          <motion.div variants={fade} className={cn("border rounded-2xl p-6", TIER_BG[tier])}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className={cn("w-5 h-5", TIER_COLORS[tier])} />
                  <span className={cn("text-sm font-semibold uppercase tracking-wider", TIER_COLORS[tier])}>{tier} Member</span>
                </div>
                <p className="text-3xl font-bold">{loyalty.account.points.toLocaleString()} <span className="text-base font-normal text-white/60">points</span></p>
                <p className="text-sm text-white/60 mt-1">{loyalty.account.totalVisits} visits · {formatCurrency(loyalty.account.totalSpent)} spent</p>
              </div>
              <div className="text-right">
                {tier !== "PLATINUM" && (
                  <>
                    <p className="text-xs text-white/60">Next tier in</p>
                    <p className="text-xl font-bold">{visitsToNext} <span className="text-sm font-normal text-white/60">visits</span></p>
                  </>
                )}
                {tier === "PLATINUM" && <Zap className="w-8 h-8 text-cyan-400" />}
              </div>
            </div>

            {loyalty.rewards.length > 0 && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {loyalty.rewards.slice(0, 3).map((r) => (
                  <span key={r.id} className="flex items-center gap-1 text-xs bg-white/10 rounded-full px-3 py-1">
                    <Gift className="w-3 h-3 text-[#d4a017]" /> {r.name} · {r.pointsCost}pts
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Upcoming Bookings */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#d4a017]" /> Upcoming Appointments
          </h2>

          {loadingBookings ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : upcoming.length === 0 ? (
              <div className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center">
                <Scissors className="w-10 h-10 text-white/40 mx-auto mb-3" />
                <p className="text-white/60">No upcoming appointments</p>
              <Link href="/booking" className="mt-3 inline-block text-[#d4a017] text-sm hover:underline">Book a haircut →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <motion.div key={b.id} variants={fade}
                  className="bg-[#111] border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-[#d4a017]/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#d4a017]/10 rounded-xl flex items-center justify-center">
                      <Scissors className="w-5 h-5 text-[#d4a017]" />
                    </div>
                    <div>
                      <p className="font-semibold">{b.service.name}</p>
                      <p className="text-sm text-white/60">{b.shop.name} · {b.barber.user.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(b.scheduledAt)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(b.scheduledAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#d4a017]">{formatCurrency(b.totalAmount)}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", b.status === "CONFIRMED" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>
                      {b.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        {past.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-white/60" /> Recent History
            </h2>
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
              {past.map((b, i) => (
                <div key={b.id} className={cn("flex items-center justify-between p-4", i > 0 && "border-t border-white/5")}>
                  <div>
                    <p className="font-medium text-sm">{b.service.name}</p>
                    <p className="text-xs text-white/60">{formatDate(b.scheduledAt)} · {b.shop.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white/70">{formatCurrency(b.totalAmount)}</span>
                    {b.status === "COMPLETED" && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Done</span>
                    )}
                    {b.status === "NO_SHOW" && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">No Show</span>
                    )}
                    {b.status === "CANCELLED" && (
                      <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">Cancelled</span>
                    )}
                    {b.status === "COMPLETED" && (
                      <button
                        onClick={() => { setReviewBooking(b); setRating(5); setComment(""); }}
                        className="text-xs text-[#d4a017] hover:underline flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" /> Rate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Scissors, label: "Book Haircut", href: "/booking" },
            { icon: Clock,    label: "Join Queue",   href: "/queue" },
            { icon: Gift,     label: "My Rewards",   href: "/shops" },
            { icon: Star,     label: "Browse Shops", href: "/shops" },
          ].map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href}
              className="bg-[#111] border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-[#d4a017]/40 hover:bg-[#d4a017]/5 transition-all group">
              <Icon className="w-6 h-6 text-[#d4a017] group-hover:scale-110 transition-transform" />
              <span className="text-xs text-white/70 font-medium">{label}</span>
            </Link>
          ))}
        </div>

      </motion.div>
    </div>
  );
}
