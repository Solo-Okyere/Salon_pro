"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Scissors, MapPin, Users, Star, Search, ArrowRight,
  Clock, CheckCircle, Sparkles, Phone,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Shop {
  id: string;
  name: string;
  slug: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  isVerified: boolean;
  barbers: Array<{ user: { name: string; avatar: string | null } }>;
  services: Array<{ name: string; price: number; duration: number }>;
  _count: { reviews: number };
}

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Cycle through the 7 real photos for card banners
const PHOTOS = [
  "/images/barbershop-1.jpg",
  "/images/barbershop-2.jpg",
  "/images/barbershop-3.jpg",
  "/images/barbershop-4.jpg",
  "/images/barbershop-5.jpg",
  "/images/barbershop-6.jpg",
  "/images/barbershop-7.jpg",
];

function ShopCard({ shop, index }: { shop: Shop; index: number }) {
  const photo = PHOTOS[index % PHOTOS.length];
  const minPrice = shop.services.length
    ? Math.min(...shop.services.map(s => s.price))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease }}
    >
      <Link
        href={`/shops/${shop.slug}`}
        className="block group glass-card overflow-hidden"
      >
        {/* Photo banner */}
        <div className="relative h-36 overflow-hidden">
          <Image
            src={photo}
            alt={shop.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-[#080810]/30 to-transparent" />
          {/* Verified badge */}
          {shop.isVerified && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
              style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }}>
              <CheckCircle className="w-3 h-3" /> Verified
            </div>
          )}
          {/* Shop initials over photo */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-black shrink-0"
              style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)", boxShadow: "0 4px 12px rgba(212,160,23,0.4)" }}>
              {shop.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="font-bold text-sm text-white group-hover:text-[#d4a017] transition-colors mb-1 truncate">
            {shop.name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-3">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{shop.city}, {shop.region}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap mb-3">
            <span className="flex items-center gap-1 text-xs text-white/70">
              <Users className="w-3 h-3" /> {shop.barbers.length} barber{shop.barbers.length !== 1 ? "s" : ""}
            </span>
            {shop._count.reviews > 0 && (
              <span className="flex items-center gap-1 text-xs text-white/70">
                <Star className="w-3 h-3 fill-[#d4a017] text-[#d4a017]" /> {shop._count.reviews}
              </span>
            )}
            {minPrice !== null && (
              <span className="text-xs text-white/70">From GHS {minPrice}</span>
            )}
          </div>

          {shop.services.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {shop.services.slice(0, 2).map(s => (
                <span key={s.name}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)", color: "rgba(212,160,23,0.8)" }}>
                  {s.name}
                </span>
              ))}
              {shop.services.length > 2 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white/40"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  +{shop.services.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            {shop.phone && (
              <span className="flex items-center gap-1 text-xs text-white/50">
                <Phone className="w-3 h-3" /> {shop.phone}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#d4a017] group-hover:gap-2 transition-all">
              Book <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ShopsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ success: boolean; data: Shop[] }>({
    queryKey: ["public-shops"],
    queryFn: () => fetch("/api/shops").then(r => r.json()),
    staleTime: 60_000,
  });

  const shops = data?.data ?? [];
  const filtered = shops.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.region.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#060608] text-white">

      {/* Full-screen photo tint backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Image src="/images/barbershop-6.jpg" alt="" fill sizes="100vw" className="object-cover opacity-15" />
        <div className="absolute inset-0 bg-[#060608]/85" />
        <div className="absolute inset-0 grid-bg opacity-40" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-10 py-4 glass-dark border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl btn-gold flex items-center justify-center">
            <Scissors className="w-4 h-4 text-black" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">SalonPro</span>
        </Link>
        <Link href="/login"
          className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2 rounded-xl border border-white/10 hover:border-white/20">
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <div className="relative z-10 pt-32 pb-12 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[100px] opacity-20"
            style={{ background: "radial-gradient(ellipse, #d4a017 0%, transparent 70%)" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-bold"
            style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)", color: "#d4a017" }}>
            <Sparkles className="w-3 h-3" /> Find your barbershop
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
            Book your <span className="text-gradient">perfect cut</span>
          </h1>
          <p className="text-white/60 text-lg max-w-md mx-auto mb-8">
            Browse verified barbershops near you. Book online or join the virtual queue.
          </p>

          {/* Glass search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by shop name or city…"
              className="glass-input w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm"
            />
          </div>
        </motion.div>
      </div>

      {/* Shop grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] h-64 skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <Scissors className="w-12 h-12 mx-auto mb-4 text-white/10" />
              <p className="text-white/50 font-medium">No shops found</p>
              <p className="text-white/50 text-sm mt-1">
              {search ? "Try a different search term" : "No shops have been registered yet"}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-white/50">
                {filtered.length} shop{filtered.length !== 1 ? "s" : ""} found
              </p>
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                <Clock className="w-3 h-3" /> Live
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((shop, i) => (
                <ShopCard key={shop.id} shop={shop} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
