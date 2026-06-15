"use client";

import { motion, useScroll, useTransform, useSpring, AnimatePresence, type Variants } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Scissors, Clock, Users, TrendingUp, Smartphone, Zap, BarChart3,
  MessageSquare, CreditCard, Brain, Star, ChevronRight, Check,
  ArrowRight, Menu, X, Shield, Sparkles, Phone, Globe, Trophy, Play,
} from "lucide-react";

// ── Animation Variants ───────────────────────────────────────────────────────

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: (i as number) * 0.1, ease: easeOut },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, delay: (i as number) * 0.08 },
  }),
};

// ── Animated Counter ─────────────────────────────────────────────────────────

function Counter({ to, suffix = "", duration = 2 }: { to: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = to / (duration * 60);
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(id); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [started, to, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ── Floating Dashboard Card ───────────────────────────────────────────────────

function DashMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1.2, delay: 0.6, ease: easeOut }}
      style={{ perspective: 1200 }}
      className="relative mx-auto max-w-2xl w-full"
    >
      {/* Glow behind card */}
      <div className="absolute inset-0 -z-10 blur-[80px] scale-90 opacity-40"
        style={{ background: "radial-gradient(ellipse, rgba(212,160,23,0.25) 0%, transparent 70%)" }} />

      <div className="rounded-2xl border border-white/10 bg-[#0e0e14] shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#080810]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 mx-4 h-5 bg-white/5 rounded-full" />
          <div className="text-xs text-white/20">SalonPro Dashboard</div>
        </div>

        {/* Dashboard grid */}
        <div className="p-4 grid grid-cols-3 gap-3">
          {[
            { label: "Revenue Today", value: "GHS 1,240", color: "#d4a017", trend: "+18%" },
            { label: "Queue Now", value: "7 waiting", color: "#60a5fa", trend: "Live" },
            { label: "Bookings", value: "23 today", color: "#34d399", trend: "+5%" },
          ].map((m, i) => (
            <motion.div key={m.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.15, duration: 0.5 }}
              className="rounded-xl p-3 bg-white/5 border border-white/5">
              <div className="text-xs text-white/40 mb-1">{m.label}</div>
              <div className="font-bold text-sm" style={{ color: m.color }}>{m.value}</div>
              <div className="text-xs mt-1 text-green-400">{m.trend}</div>
            </motion.div>
          ))}
        </div>

        {/* Mini chart area */}
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 h-24 flex items-end gap-1.5">
            {[40, 65, 50, 80, 55, 90, 75, 95, 60, 85, 70, 100].map((h, i) => (
              <motion.div key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 1.2 + i * 0.05, duration: 0.5, ease: easeOut }}
                className="flex-1 rounded-sm opacity-80"
                style={{ background: `linear-gradient(to top, rgba(212,160,23,0.8), rgba(212,160,23,0.2))` }}
              />
            ))}
          </div>
        </div>

        {/* Queue rows */}
        <div className="px-4 pb-4 space-y-2">
          {[
            { name: "Kofi Mensah", service: "Fade + Beard", wait: "2 min", status: "Next" },
            { name: "Emmanuel A.", service: "Low Cut", wait: "15 min", status: "Waiting" },
            { name: "Isaac B.", service: "Braids", wait: "30 min", status: "Waiting" },
          ].map((row, i) => (
            <motion.div key={row.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.6 + i * 0.1 }}
              className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
              <div>
                <div className="text-xs font-semibold text-white/80">{row.name}</div>
                <div className="text-xs text-white/30">{row.service}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40">{row.wait}</div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${row.status === "Next" ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/30"}`}>
                  {row.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────

function FeatureCard({ icon: Icon, title, desc, badge, delay = 0 }: {
  icon: React.ElementType; title: string; desc: string; badge?: string; delay?: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      custom={delay}
      variants={fadeUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group glass-card p-6 overflow-hidden cursor-default"
    >
      {/* Hover glow */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(212,160,23,0.08) 0%, transparent 60%)" }}
      />

      {badge && (
        <span className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full bg-[#d4a017]/15 text-[#d4a017] border border-[#d4a017]/20">
          {badge}
        </span>
      )}

      <motion.div
        animate={{ scale: hovered ? 1.1 : 1, rotate: hovered ? 5 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.15)" }}
      >
        <Icon className="w-6 h-6" style={{ color: "#d4a017" }} />
      </motion.div>

      <h3 className="font-bold text-base mb-2 text-white">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const rawY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroY = useSpring(rawY, { stiffness: 100, damping: 30 });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const FEATURES = [
    { icon: Smartphone, title: "Virtual Queue System", desc: "Customers join from anywhere. Real-time position, estimated wait, zero crowding at the door.", badge: "Most Popular" },
    { icon: MessageSquare, title: "WhatsApp Automation", desc: "Booking confirmations, 2-hour reminders, loyalty rewards — all sent automatically via WhatsApp." },
    { icon: CreditCard, title: "Mobile Money Payments", desc: "Accept MTN MoMo, Telecel Cash, AT Money. Deposits lock in bookings and eliminate no-shows." },
    { icon: Brain, title: "AI Forecasting Engine", desc: "Predict your busiest days weeks ahead using Prophet, XGBoost, and LightGBM ensemble models.", badge: "AI-Powered" },
    { icon: BarChart3, title: "Owner Analytics", desc: "Revenue trends, no-show rates, top barbers, peak hours — all visible in one real-time dashboard." },
    { icon: Trophy, title: "Loyalty & CRM", desc: "Every customer earns points. Bronze → Silver → Gold → Platinum. Automated win-back campaigns." },
  ];

  const PROBLEMS = [
    { icon: Users, text: "Overcrowding scares customers away" },
    { icon: Clock, text: "Long waits with no estimated time" },
    { icon: TrendingUp, text: "No-shows waste barber idle time" },
    { icon: BarChart3, text: "Zero data on revenue or trends" },
    { icon: MessageSquare, text: "Everything managed via WhatsApp manually" },
    { icon: CreditCard, text: "Cash-only chaos, no payment records" },
  ];

  return (
    <div className="min-h-screen bg-[#060608] text-white overflow-x-hidden" suppressHydrationWarning>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: easeOut }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-10 py-4 transition-all duration-300 ${
          scrolled ? "bg-[#060608]/90 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2 select-none">
          <motion.div whileHover={{ rotate: 20 }} transition={{ type: "spring", stiffness: 400 }}
            className="w-8 h-8 rounded-xl flex items-center justify-center btn-gold">
            <Scissors className="w-4 h-4 text-black" />
          </motion.div>
          <span className="font-extrabold text-lg tracking-tight">SalonPro</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
          {["Features", "How it works", "Pricing", "FAQ"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}
              className="hover:text-white transition-colors duration-200 hover:text-[#d4a017]">
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/shops" className="hidden md:flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors px-4 py-2 rounded-xl border border-white/10 hover:border-white/20">
            Find a Shop
          </Link>
          <Link href="/booking"
            className="btn-gold text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5">
            Book Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button onClick={() => setNavOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {navOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060608] flex flex-col p-6">
            <div className="flex items-center justify-between mb-12">
              <span className="font-extrabold text-xl">SalonPro</span>
              <button onClick={() => setNavOpen(false)} className="p-2 rounded-xl hover:bg-white/5">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {["Features", "How it works", "Pricing", "FAQ"].map((item) => (
                <motion.a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  onClick={() => setNavOpen(false)}
                  className="text-2xl font-bold py-3 text-white/60 hover:text-white transition-colors">
                  {item}
                </motion.a>
              ))}
            </nav>
            <Link href="/shops" className="mt-auto btn-gold py-4 rounded-2xl text-center font-bold text-base">
              Find a Shop
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-4 grid-bg overflow-hidden">

        {/* Photo backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/images/barbershop-1.jpg"
            alt="Barbershop"
            fill
            sizes="100vw"
            className="object-cover object-center opacity-25"
            priority
          />
          <div className="absolute inset-0 photo-overlay-heavy" />
        </div>

        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="pulse-glow absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(212,160,23,0.1) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-25"
            style={{ background: "#d4a017" }} />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px] opacity-10"
            style={{ background: "#6060ff" }} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center w-full max-w-5xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold tracking-widest uppercase"
            style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)", color: "#d4a017" }}
          >
            <Zap className="w-3 h-3" />
            AI-Powered Barber Shop OS · Built for Ghana
          </motion.div>

          {/* Headline */}
          <div className="overflow-hidden mb-4">
            <motion.h1
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: easeOut, delay: 0.1 }}
              className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9]"
            >
              Stop the{" "}
              <span className="text-gradient">Crowd.</span>
            </motion.h1>
          </div>
          <div className="overflow-hidden mb-4">
            <motion.h1
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: easeOut, delay: 0.2 }}
              className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9]"
            >
              <span className="text-white/90">Cut More.</span>
            </motion.h1>
          </div>
          <div className="overflow-hidden mb-10">
            <motion.h1
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: easeOut, delay: 0.3 }}
              className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9]"
            >
              <span className="text-white/40">Earn More.</span>
            </motion.h1>
          </div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-lg md:text-xl text-white/40 max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Virtual queues · WhatsApp automation · Mobile Money payments ·<br className="hidden md:block" />
            AI forecasting — one platform for your entire barbershop.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/booking"
              className="btn-gold w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 relative overflow-hidden group">
              <span className="relative z-10 flex items-center gap-2">
                Book a Haircut <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link href="/shops"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 text-base font-semibold text-white/60 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2">
              <Users className="w-4 h-4" /> Browse Shops
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="flex items-center justify-center gap-8 md:gap-16 flex-wrap"
          >
            {[
              { to: 3, suffix: "×", label: "More bookings" },
              { to: 80, suffix: "%", label: "Fewer no-shows" },
              { to: 2, suffix: "hrs", label: "Saved daily" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-gradient">
                  <Counter to={s.to} suffix={s.suffix} />
                </div>
                <div className="text-xs text-white/30 mt-1 font-medium tracking-wide uppercase">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.0 }}
          className="relative z-10 w-full max-w-3xl mx-auto mt-16 px-4"
        >
          <DashMock />
        </motion.div>
      </section>

      {/* ── Marquee social proof ────────────────────────────────────────────── */}
      <div className="border-y border-white/5 py-4 overflow-hidden bg-[#0a0a0e]">
        <div className="marquee-track gap-12">
          {[...Array(2)].map((_, repeat) => (
            <div key={repeat} className="flex items-center gap-12 pr-12">
              {["MTN MoMo", "Telecel Cash", "AT Money", "WhatsApp Business", "Supabase", "AI Forecasting", "300+ Shops", "Made in Ghana"].map((item) => (
                <span key={item} className="text-sm text-white/20 font-semibold whitespace-nowrap flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#d4a017] inline-block" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Photo collage strip ─────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { src: "/images/barbershop-3.jpg", tall: true },
            { src: "/images/barbershop-4.jpg", tall: false },
            { src: "/images/barbershop-5.jpg", tall: false },
            { src: "/images/barbershop-2.jpg", tall: true },
          ].map((img, i) => (
            <motion.div
              key={img.src}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.09, duration: 0.6 }}
              className={`relative overflow-hidden rounded-2xl ${img.tall ? "row-span-2 h-80 md:h-96" : "h-36 md:h-44"}`}
            >
              <Image
                src={img.src}
                alt="Barbershop"
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Problem ─────────────────────────────────────────────────────────── */}
      <section className="py-32 px-4 md:px-10 max-w-6xl mx-auto">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
            The Problem
          </motion.div>
          <motion.h2 variants={fadeUp}
            className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-tight">
            Your shop loses <span className="text-gradient">GHS 3,000+</span><br />every month to avoidable problems
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/40 text-lg max-w-2xl mx-auto">
            Without a system, every Ghanaian barber shop faces the same six costly problems.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
        >
          {PROBLEMS.map(({ icon: Icon, text }) => (
            <motion.div key={text} variants={fadeUp}
              className="group flex items-center gap-3 p-5 glass-card hover:border-red-500/20 hover:bg-red-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-500/10">
                <Icon className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-sm font-medium text-white/60 group-hover:text-white/80 transition-colors">{text}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-32 px-4 md:px-10 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)", color: "#d4a017" }}>
              <Sparkles className="w-3 h-3" /> The Solution
            </motion.div>
            <motion.h2 variants={fadeUp}
              className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
              One platform.<br /><span className="text-gradient">Everything solved.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/40 text-lg max-w-2xl mx-auto">
              14 modules working together so your shop runs like a premium operation.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-32 px-4 md:px-10 max-w-5xl mx-auto">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black tracking-tighter">
            Up and running in <span className="text-gradient">5 minutes</span>
          </motion.h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[23px] top-8 bottom-8 w-px bg-gradient-to-b from-[#d4a017]/50 via-[#d4a017]/20 to-transparent hidden md:block" />

          <div className="space-y-4">
            {[
              { step: "01", title: "Create your shop profile", desc: "Add shop details, services, and barbers. Takes 5 minutes." },
              { step: "02", title: "Share your booking link", desc: "Customers book or join your virtual queue from their phone — no app download needed." },
              { step: "03", title: "Automation takes over", desc: "WhatsApp reminders, MoMo deposits, queue updates — all sent automatically." },
              { step: "04", title: "Watch revenue grow", desc: "No-shows drop 80%. Bookings triple. Your shop runs like a premium operation." },
            ].map((s, i) => (
              <motion.div key={s.step}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: easeOut }}
                className="flex gap-5 p-6 glass-card group"
              >
                <div className="relative w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center font-black text-sm pulse-ring"
                  style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.2)", color: "#d4a017" }}>
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1 group-hover:text-[#d4a017] transition-colors">{s.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-32 px-4 md:px-10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(212,160,23,0.05) 0%, transparent 70%)" }} />

        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
              Simple pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/40 text-lg">
              Start free. No credit card. Scale when you grow.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            className="grid md:grid-cols-3 gap-5"
          >
            {[
              {
                name: "Starter", price: "Free", period: "", desc: "Perfect for solo barbers",
                features: ["1 barber", "50 bookings/month", "Virtual queue", "Basic analytics"],
                cta: "Start free", featured: false,
              },
              {
                name: "Pro", price: "GHS 150", period: "/mo", desc: "For growing shops",
                features: ["Up to 5 barbers", "Unlimited bookings", "WhatsApp automation", "Mobile Money deposits", "AI no-show prediction", "CRM & Loyalty tiers"],
                cta: "Start 14-day trial", featured: true,
              },
              {
                name: "Enterprise", price: "Custom", period: "", desc: "Multi-branch chains",
                features: ["Unlimited barbers & branches", "Multi-location analytics", "AI demand forecasting", "API access", "Dedicated support", "White-label option"],
                cta: "Talk to us", featured: false,
              },
            ].map((plan, i) => (
              <motion.div key={plan.name} custom={i} variants={fadeUp}
                className={`relative flex flex-col p-7 glass-card ${
                  plan.featured ? "glow-gold" : ""
                }`}
              >
                {plan.featured && (
                  <>
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full btn-gold text-xs font-black">
                      Most Popular
                    </div>
                    <div className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,160,23,0.06) 0%, transparent 60%)" }} />
                  </>
                )}
                <div className="mb-6 relative">
                  <p className="text-white/40 text-sm mb-2">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    {plan.period && <span className="text-white/40 text-sm">{plan.period}</span>}
                  </div>
                  <p className="text-xs text-white/30">{plan.desc}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(212,160,23,0.1)" }}>
                        <Check className="w-3 h-3 text-[#d4a017]" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/shops"
                  className={`w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all ${
                    plan.featured
                      ? "btn-gold"
                      : "border border-white/10 text-white/60 hover:text-white hover:border-white/20"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section className="py-32 px-4 md:px-10 max-w-6xl mx-auto">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
            Barbers love <span className="text-gradient">SalonPro</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/40 text-lg">Real results from real shops across Ghana.</motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid md:grid-cols-3 gap-5"
        >
          {[
            { name: "Kwame A.", role: "Shop Owner, Accra", avatar: "KA", text: "My no-shows dropped from 6 per day to 1. The deposit system changed everything. I'm making GHS 2,000 more every month.", stars: 5 },
            { name: "Isaac B.", role: "Master Barber, Kumasi", avatar: "IB", text: "I know exactly who's coming in and when. No more chaos at the door. My customers love the WhatsApp reminders.", stars: 5 },
            { name: "Emmanuel T.", role: "Shop Owner, Takoradi", avatar: "ET", text: "The AI predicted my busiest week of the year. I hired an extra barber just in time. That's GHS 8,000 I would have missed.", stars: 5 },
          ].map((t, i) => (
            <motion.div key={t.name} custom={i} variants={fadeUp}
              className="p-6 glass-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none opacity-30"
                style={{ background: "#d4a017" }} />
              <div className="flex gap-1 mb-4">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#d4a017] text-[#d4a017]" />
                ))}
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-6 relative">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-black"
                  style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)" }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-white/30">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-32 px-4 md:px-10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black tracking-tighter">
              Common questions
            </motion.h2>
          </motion.div>
          <FAQ />
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(212,160,23,0.08) 0%, transparent 60%)" }} />

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="max-w-3xl mx-auto text-center relative"
        >
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)", color: "#d4a017" }}>
            <Shield className="w-3 h-3" /> No credit card required
          </motion.div>
          <motion.h2 variants={fadeUp}
            className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.95]">
            Ready to modernize<br /><span className="text-gradient">your shop?</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-white/40 mb-10 leading-relaxed">
            Join hundreds of Ghanaian barber shops already running on SalonPro.<br />
            Start free — upgrade when you're ready.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/shops"
              className="btn-gold w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 group">
              Find a Shop
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-8 flex items-center justify-center gap-6 text-sm text-white/25">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#d4a017]" /> Free forever plan</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#d4a017]" /> Setup in 5 min</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#d4a017]" /> Cancel anytime</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-4 md:px-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl btn-gold flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-extrabold tracking-tight">SalonPro</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/20">
            <Globe className="w-3 h-3" />
            <span>Built for Ghana · Scaling across Africa · © 2025</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/30">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}

// ── FAQ Component ─────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    { q: "Do my customers need to download an app?", a: "No. Customers book and join queues directly via WhatsApp or a web link. Zero friction, zero downloads." },
    { q: "Which Mobile Money providers do you support?", a: "MTN MoMo, Telecel Cash, and AT Money — all major Ghanaian mobile money networks." },
    { q: "How does the virtual queue work?", a: "Customers join from their phone, see their position in real time, and get a WhatsApp notification when it's almost their turn. No crowds at the door." },
    { q: "Can I use SalonPro for multiple branches?", a: "Yes. Enterprise plan supports unlimited branches with unified analytics across all locations." },
    { q: "What happens if the internet goes down?", a: "Core functions work offline. The system syncs automatically when connectivity returns." },
  ];

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          className="glass-card overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-5 text-left"
          >
            <span className="font-semibold text-sm text-white/80">{item.q}</span>
            <motion.span animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </motion.span>
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: easeOut }}
              >
                <p className="px-6 pb-5 text-sm text-white/40 leading-relaxed border-t border-white/5 pt-4">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
