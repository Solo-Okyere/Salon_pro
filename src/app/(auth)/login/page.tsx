"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Scissors, ArrowRight, Loader2, Eye, EyeOff, Phone, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/slices/authSlice";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const ROLE_REDIRECTS: Record<string, string> = {
  OWNER: "/owner",
  BARBER: "/barber",
  ADMIN: "/admin",
  CUSTOMER: "/customer",
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { phone, password });
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      const dest = ROLE_REDIRECTS[user.role] ?? "/customer";
      router.replace(dest);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Login failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Photo backdrop */}
      <div className="absolute inset-0">
        <Image
          src="/images/barbershop-1.jpg"
          alt="Barbershop"
          fill
          sizes="100vw"
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#060608]/85 via-[#060608]/60 to-[#060608]/85" />
      </div>
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[120px] opacity-20"
          style={{ background: "radial-gradient(ellipse, #d4a017 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] rounded-full blur-[80px] opacity-10"
          style={{ background: "#6060ff" }} />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Back */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors">
            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to home
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease }}
          className="glass rounded-3xl p-8"
          style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)" }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-2.5 mb-7"
          >
            <motion.div
              whileHover={{ rotate: 20 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="w-10 h-10 rounded-2xl btn-gold flex items-center justify-center"
            >
              <Scissors className="w-5 h-5 text-black" />
            </motion.div>
            <span className="text-xl font-extrabold tracking-tight">SalonPro</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6"
          >
            <h1 className="text-2xl font-black tracking-tight mb-1.5">Staff login</h1>
            <p className="text-white/60 text-sm">
              Enter your phone number and password to access your dashboard.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Phone */}
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Phone number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="024 000 0000"
                  autoComplete="tel"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#d4a017]/50 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-11 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#d4a017]/50 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-xs px-1">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Sign in <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </motion.form>

          {/* Platform admin link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 pt-5 border-t border-white/5 text-center"
          >
            <Link href="/admin/login" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Platform admin? Access here →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
