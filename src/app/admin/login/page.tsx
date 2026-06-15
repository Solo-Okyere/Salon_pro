"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, EyeOff, Loader2, ArrowRight, Scissors } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/store/slices/authSlice";
import type { User } from "@/types";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Seed the Zustand auth store so the dashboard layout sees role=ADMIN
        useAuthStore.getState().setAuth(data.user as User, data.accessToken, "");
        router.push("/admin");
      } else {
        setError(data.error ?? "Invalid access code");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Full-screen photo backdrop */}
      <div className="absolute inset-0">
        <Image
          src="/images/barbershop-2.jpg"
          alt="Barbershop"
          fill
          sizes="100vw"
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#060608]/90 via-[#060608]/70 to-red-950/30" />
      </div>

      {/* Grid bg */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Red glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full blur-[120px] opacity-25 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #ef4444 0%, transparent 70%)" }} />

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <div className="w-8 h-8 rounded-xl btn-gold flex items-center justify-center">
            <Scissors className="w-4 h-4 text-black" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">SalonPro</span>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease }}
          className="glass rounded-3xl p-8"
          style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)" }}
        >
          {/* Shield icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto relative overflow-hidden"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <Shield className="w-8 h-8 text-red-400 relative z-10" />
            <div className="absolute inset-0 glass-shine" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-black tracking-tight text-white mb-2">Super Admin</h1>
            <p className="text-sm text-white/40">Restricted access — enter your platform access code</p>
          </motion.div>

          <form onSubmit={submit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <label className="text-xs font-medium text-white/40 mb-2 block flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Access Code
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  placeholder="Enter access code"
                  className="glass-input w-full px-4 py-3 pr-12 rounded-xl text-sm"
                  style={error ? { borderColor: "rgba(239,68,68,0.5)" } : {}}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-xs text-red-400 flex items-center gap-1"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              type="submit"
              disabled={loading || !code}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #b91c1c, #ef4444)", color: "white", boxShadow: "0 4px 20px rgba(239,68,68,0.35)" }}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <> Access Admin Console <ArrowRight className="w-4 h-4" /> </>
              }
            </motion.button>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-xs text-white/15"
          >
            SalonPro Platform · Restricted Access
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
