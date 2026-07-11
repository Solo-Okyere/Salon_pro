"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Scissors, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/store/slices/authSlice";
import type { User } from "@/types";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(idx: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (next.every((d) => d !== "")) verifyOTP(next.join(""));
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  async function verifyOTP(code: string) {
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP(phone, code);
      setAuth(data.user as User, data.accessToken, data.refreshToken);
      toast.success("Welcome to SalonPro!");
      const role = data.user.role;
      if (role === "OWNER") router.replace("/owner");
      else if (role === "BARBER") router.replace("/barber");
      else if (role === "ADMIN") router.replace("/admin");
      else router.replace("/customer");
    } catch {
      toast.error("Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      await authAPI.sendOTP(phone);
      toast.success("New OTP sent");
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      toast.error("Failed to resend OTP");
    }
  }

  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Photo backdrop */}
      <div className="absolute inset-0">
        <Image src="/images/barbershop-4.jpg" alt="Barbershop" fill sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#060608]/85 via-[#060608]/60 to-[#060608]/85" />
      </div>
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Gold glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full blur-[100px] opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #d4a017 0%, transparent 70%)" }} />

      <div className="w-full max-w-sm relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="glass rounded-3xl p-8"
          style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl btn-gold flex items-center justify-center">
              <Scissors className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">SalonPro</span>
          </div>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <h1 className="text-2xl font-black mb-1">Check your phone</h1>
          <p className="text-white/60 text-sm mb-8">
            We sent a 6-digit code to{" "}
            <span className="text-white font-semibold">{phone}</span>
          </p>

          {/* OTP boxes */}
          <div className="flex gap-2.5 mb-8">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={loading}
                className="flex-1 h-14 text-center text-xl font-bold rounded-xl glass-input transition-all disabled:opacity-50"
              />
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-white/60 text-sm mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying…
            </div>
          )}

          <p className="text-sm text-white/50 text-center">
            Didn&apos;t receive it?{" "}
            {resendCooldown > 0 ? (
              <span className="text-white/50">Resend in {resendCooldown}s</span>
            ) : (
              <button
                onClick={resend}
                className="text-[#d4a017] font-medium hover:underline underline-offset-2 transition-colors"
              >
                Resend OTP
              </button>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060608] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#d4a017] animate-spin" />
      </div>
    }>
      <VerifyForm />
    </Suspense>
  );
}
