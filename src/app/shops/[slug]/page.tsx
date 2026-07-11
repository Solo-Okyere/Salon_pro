"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Scissors, MapPin, Phone, Users, Star, Clock, Calendar,
  ArrowLeft, CheckCircle, ArrowRight, Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Barber {
  id: string;
  rating: number;
  user: { id: string; name: string; avatar: string | null; phone: string };
  _count: { reviews: number };
}
interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}
interface ShopDetail {
  id: string;
  name: string;
  slug: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  isVerified: boolean;
  barbers: Barber[];
  services: Service[];
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    customer: { name: string; avatar: string | null };
    createdAt: string;
  }>;
  _count: { reviews: number; bookings: number };
}

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function ShopPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: ShopDetail }>({
    queryKey: ["shop", slug],
    queryFn: () => fetch(`/api/shops/${slug}`).then(r => r.json()),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a017] animate-spin" />
      </div>
    );
  }

  if (isError || !data?.success || !data.data) {
    return (
      <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center text-white gap-4">
        <Scissors className="w-12 h-12 text-white/40" />
        <h1 className="text-xl font-bold">Shop not found</h1>
        <Link href="/shops" className="text-sm text-[#d4a017] hover:underline">Browse all shops</Link>
      </div>
    );
  }

  const shop = data.data;
  const avgRating = shop.reviews.length
    ? shop.reviews.reduce((sum, r) => sum + r.rating, 0) / shop.reviews.length
    : null;

  // Pick a photo based on slug hash
  const photoIndex = (shop.name.charCodeAt(0) + shop.name.length) % 7 + 1;
  const coverPhoto = `/images/barbershop-${photoIndex}.jpg`;

  return (
    <div className="min-h-screen bg-[#060608] text-white">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-10 py-4 glass-dark border-b border-white/[0.06]">
        <Link href="/shops" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> All shops
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg btn-gold flex items-center justify-center">
            <Scissors className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="font-extrabold tracking-tight">SalonPro</span>
        </div>
        <Link href="/login"
          className="text-sm text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20">
          Owner&nbsp;/&nbsp;Staff login
        </Link>
      </nav>

      {/* Cover photo header */}
      <div className="relative h-72 md:h-96 w-full mt-0">
        <Image src={coverPhoto} alt={shop.name} fill sizes="100vw" className="object-cover object-center" priority />
        <div className="absolute inset-0 photo-overlay-heavy" />
        {/* Floating shop identity card over photo */}
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-6 pt-20">
          <div className="max-w-4xl mx-auto flex items-end gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-black shrink-0"
              style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)", boxShadow: "0 8px 24px rgba(212,160,23,0.5)" }}>
              {shop.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl md:text-3xl font-black text-white">{shop.name}</h1>
                {shop.isVerified && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm"
                    style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/60">
                <MapPin className="w-3.5 h-3.5" /> {shop.city}, {shop.region}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-20">

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex items-center gap-5 flex-wrap mb-6 text-sm text-white/50"
        >
          {shop.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {shop.phone}</span>}
          {avgRating && (
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-[#d4a017] text-[#d4a017]" />
              {avgRating.toFixed(1)} ({shop._count.reviews} reviews)
            </span>
          )}
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {shop.barbers.length} barbers</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {shop._count.bookings} bookings</span>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <Link
            href={`/booking?shop=${shop.id}`}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-black transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)", boxShadow: "0 6px 24px rgba(212,160,23,0.4)" }}
          >
            <Calendar className="w-4 h-4" /> Book Appointment
          </Link>
          <Link
            href={`/queue?shopId=${shop.id}`}
            className="glass flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-white/80 transition-all hover:text-white hover:-translate-y-0.5"
          >
            <Clock className="w-4 h-4" /> Join Queue
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease }}
            className="glass-card p-5"
          >
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Services</h2>
            {shop.services.length === 0 ? (
              <p className="text-sm text-white/40">No services listed yet</p>
            ) : (
              <div className="space-y-0">
                {shop.services.map((s, i) => (
                  <div key={s.id} className={`flex items-center justify-between py-3 ${i < shop.services.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                    <div>
                      <p className="text-sm font-medium text-white/80">{s.name}</p>
                      <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {s.duration} min
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#d4a017]">GHS {s.price}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Barbers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease }}
            className="glass-card p-5"
          >
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Our Barbers</h2>
            {shop.barbers.length === 0 ? (
              <p className="text-sm text-white/40">No barbers listed yet</p>
            ) : (
              <div className="space-y-3">
                {shop.barbers.map(b => (
                  <div key={b.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0"
                      style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)" }}>
                      {b.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/80">{b.user.name}</p>
                      {b._count.reviews > 0 && (
                        <p className="text-xs text-white/50 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#d4a017] text-[#d4a017]" />
                          {b.rating?.toFixed(1) ?? "—"} · {b._count.reviews} reviews
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Reviews */}
        {shop.reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22, ease }}
            className="mt-5 glass-card p-5"
          >
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
              Reviews ({shop._count.reviews})
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {shop.reviews.map(r => (
                <div key={r.id} className="p-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-[#d4a017] text-[#d4a017]" : "text-white/10"}`} />
                    ))}
                  </div>
                  {r.comment && <p className="text-sm text-white/50 mb-3 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                      style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)" }}>
                      {r.customer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/70">{r.customer.name}</p>
                      <p className="text-[10px] text-white/40">{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28, ease }}
          className="mt-6 p-6 glass-card text-center"
        >
          <p className="text-sm text-white/60 mb-4">Ready for your cut?</p>
          <Link
            href={`/booking?shop=${shop.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-black transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)", boxShadow: "0 4px 20px rgba(212,160,23,0.4)" }}
          >
            Book at {shop.name} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
