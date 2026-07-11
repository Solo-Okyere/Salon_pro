"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Store, Clock, MapPin, Phone, Mail, FileText, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface ShopSettings {
  id: string; name: string; slug: string; phone: string; email: string | null;
  address: string; city: string; region: string; description: string | null;
  openTime: string; closeTime: string; isVerified: boolean;
}

const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Central", "Eastern",
  "Volta", "Northern", "Upper East", "Upper West", "Bono",
  "Bono East", "Ahafo", "Savannah", "North East", "Oti", "Western North",
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return { value: `${h}:00`, label: i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM` };
});

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: shopData, isLoading } = useQuery<ShopSettings>({
    queryKey: ["shop-settings"],
    queryFn: () => api.get("/api/shops/settings").then((r) => r.data.data),
  });

  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", city: "",
    region: "", description: "", openTime: "08:00", closeTime: "20:00",
  });

  useEffect(() => {
    if (shopData) {
      setForm({
        name:        shopData.name        ?? "",
        phone:       shopData.phone       ?? "",
        email:       shopData.email       ?? "",
        address:     shopData.address     ?? "",
        city:        shopData.city        ?? "",
        region:      shopData.region      ?? "",
        description: shopData.description ?? "",
        openTime:    shopData.openTime    ?? "08:00",
        closeTime:   shopData.closeTime   ?? "20:00",
      });
    }
  }, [shopData]);

  const saveMutation = useMutation({
    mutationFn: () => api.patch("/api/shops/settings", form),
    onSuccess: () => {
      toast.success("Shop settings saved");
      queryClient.invalidateQueries({ queryKey: ["shop-settings"] });
      queryClient.invalidateQueries({ queryKey: ["owner-shop-slug"] });
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Shop Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Update your shop profile and hours
            {shopData?.isVerified && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-500 text-xs font-semibold">
                ✓ Verified
              </span>
            )}
          </p>
        </div>
        <p className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-1 rounded">
          /shops/{shopData?.slug}
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        {/* Basic Info */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-card space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" /> Basic Info
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Shop Name *</label>
              <input value={form.name} onChange={set("name")} className="input-base w-full" placeholder="e.g. Kofi's Barbershop" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone *</label>
              <input value={form.phone} onChange={set("phone")} className="input-base w-full" placeholder="+233XX XXX XXXX" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
              <input value={form.email} onChange={set("email")} type="email" className="input-base w-full" placeholder="shop@email.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                className="input-base w-full resize-none"
                placeholder="Tell customers about your shop..."
              />
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-card space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Location
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Street Address *</label>
              <input value={form.address} onChange={set("address")} className="input-base w-full" placeholder="45 Osu Oxford Street" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">City *</label>
              <input value={form.city} onChange={set("city")} className="input-base w-full" placeholder="Accra" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Region *</label>
              <select value={form.region} onChange={set("region")} className="select-base w-full bg-white text-gray-900 dark:bg-[#111827] dark:text-white">
                <option value="" className="text-gray-500">Select region</option>
                {GHANA_REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Hours */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-card space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Operating Hours
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Opens at</label>
              <select value={form.openTime} onChange={set("openTime")} className="select-base w-full bg-white text-gray-900 dark:bg-[#111827] dark:text-white">
                {HOURS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Closes at</label>
              <select value={form.closeTime} onChange={set("closeTime")} className="select-base w-full bg-white text-gray-900 dark:bg-[#111827] dark:text-white">
                {HOURS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Hours shown: {form.openTime} – {form.closeTime} (Ghana time)
          </p>
        </section>

        {/* Save */}
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="btn-gold w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold disabled:opacity-60"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saveMutation.isPending ? "Saving…" : "Save Changes"}
        </button>
      </motion.div>
    </div>
  );
}
