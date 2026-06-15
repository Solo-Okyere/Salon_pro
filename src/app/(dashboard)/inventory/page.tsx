"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, AlertTriangle, TrendingDown, TrendingUp, X, ArrowDownCircle, ArrowUpCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number | null;
  supplier: { id: string; name: string } | null;
  movements: Array<{ id: string; type: string; quantity: number; notes: string | null; createdAt: string }>;
}

const CATEGORIES = ["Hair Products", "Shaving", "Tools", "Consumables", "Equipment", "Other"];

export default function InventoryPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [moveItem, setMoveItem] = useState<InventoryItem | null>(null);
  const [moveType, setMoveType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [form, setForm] = useState({ name: "", category: CATEGORIES[0], unit: "PIECE", currentStock: "0", minimumStock: "5", costPerUnit: "" });
  const [filter, setFilter] = useState<"all" | "low">("all");

  const { data: items, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: () => api.get("/api/inventory").then((r) => r.data.data),
  });

  const addMutation = useMutation({
    mutationFn: () => api.post("/api/inventory", {
      ...form,
      currentStock: parseFloat(form.currentStock) || 0,
      minimumStock: parseFloat(form.minimumStock) || 5,
      costPerUnit: form.costPerUnit ? parseFloat(form.costPerUnit) : undefined,
    }),
    onSuccess: () => {
      toast.success("Item added!");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setShowAdd(false);
    },
    onError: () => toast.error("Failed to add item"),
  });

  const moveMutation = useMutation({
    mutationFn: () => api.patch(`/api/inventory/${moveItem?.id}`, {
      type: moveType,
      quantity: parseFloat(qty),
      notes,
    }),
    onSuccess: () => {
      toast.success("Stock updated!");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setMoveItem(null);
      setQty("");
      setNotes("");
    },
    onError: () => toast.error("Failed to update stock"),
  });

  const filtered = (items ?? []).filter((i) => filter === "low" ? i.currentStock <= i.minimumStock : true);
  const lowStockCount = (items ?? []).filter((i) => i.currentStock <= i.minimumStock).length;

  const stockLevel = (item: InventoryItem) => {
    if (item.currentStock === 0) return { color: "text-red-400", bg: "bg-red-500/20", label: "Out" };
    if (item.currentStock <= item.minimumStock) return { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Low" };
    return { color: "text-green-400", bg: "bg-green-500/20", label: "OK" };
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Inventory</h1>
            <p className="text-white/40 text-sm mt-1">{items?.length ?? 0} items · {lowStockCount} low stock</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#d4a017] hover:bg-[#b8860b] text-black font-semibold px-4 py-2 rounded-xl transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-yellow-200">{lowStockCount} item{lowStockCount > 1 ? "s" : ""} running low or out of stock. Reorder soon.</p>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "low"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all",
                filter === f ? "bg-[#d4a017] text-black" : "bg-[#111] border border-white/10 text-white/60 hover:text-white")}>
              {f === "all" ? "All Items" : `Low Stock (${lowStockCount})`}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const level = stockLevel(item);
              const pct = Math.min(100, (item.currentStock / Math.max(item.minimumStock * 2, 1)) * 100);
              return (
                <motion.div key={item.id} layout
                  className="bg-[#111] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-white/40">{item.category} · {item.unit}</p>
                      {item.supplier && <p className="text-xs text-white/30 mt-0.5">Supplier: {item.supplier.name}</p>}
                    </div>
                    <span className={cn("text-xs px-2 py-1 rounded-full font-medium", level.color, level.bg)}>{level.label}</span>
                  </div>

                  {/* Stock Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-white/40 mb-1">
                      <span>Stock: <strong className="text-white">{item.currentStock}</strong></span>
                      <span>Min: {item.minimumStock}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all",
                        item.currentStock === 0 ? "bg-red-500" :
                          item.currentStock <= item.minimumStock ? "bg-yellow-500" : "bg-green-500")}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40">
                      {item.costPerUnit ? `GHS ${item.costPerUnit}/unit` : "No cost set"}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => { setMoveItem(item); setMoveType("IN"); }}
                        className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors" title="Add stock">
                        <ArrowUpCircle className="w-4 h-4 text-green-400" />
                      </button>
                      <button onClick={() => { setMoveItem(item); setMoveType("OUT"); }}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors" title="Use stock">
                        <ArrowDownCircle className="w-4 h-4 text-red-400" />
                      </button>
                      <button onClick={() => { setMoveItem(item); setMoveType("ADJUSTMENT"); }}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors" title="Adjust stock">
                        <RotateCcw className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Stock Movement Modal */}
        <AnimatePresence>
          {moveItem && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">{moveType === "IN" ? "Add Stock" : moveType === "OUT" ? "Use Stock" : "Adjust Stock"}: {moveItem.name}</h3>
                  <button onClick={() => setMoveItem(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-white/40 mb-4">Current stock: <strong className="text-white">{moveItem.currentStock} {moveItem.unit}s</strong></p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-white/50 block mb-1">{moveType === "ADJUSTMENT" ? "New Stock Level" : "Quantity"}</label>
                    <input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)}
                      className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d4a017] transition-colors" />
                  </div>
                  <div>
                    <label className="text-sm text-white/50 block mb-1">Notes</label>
                    <input value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional note..."
                      className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d4a017] transition-colors" />
                  </div>
                  <button onClick={() => moveMutation.mutate()} disabled={!qty || moveMutation.isPending}
                    className="w-full bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-40 text-black font-bold py-3 rounded-xl transition-colors">
                    {moveMutation.isPending ? "Updating..." : "Confirm"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Item Modal */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center justify-center p-4">
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg">Add Inventory Item</h2>
                  <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Item Name *", key: "name", placeholder: "Cantu Shea Butter" },
                    { label: "Category *", key: "category", type: "select" },
                    { label: "Unit", key: "unit", type: "select-unit" },
                    { label: "Current Stock", key: "currentStock", type: "number", placeholder: "0" },
                    { label: "Minimum Stock", key: "minimumStock", type: "number", placeholder: "5" },
                    { label: "Cost Per Unit (GHS)", key: "costPerUnit", type: "number", placeholder: "0.00" },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label className="text-sm text-white/50 block mb-1">{label}</label>
                      {type === "select" ? (
                        <select value={form[key as keyof typeof form]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d4a017] transition-colors">
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : type === "select-unit" ? (
                        <select value={form[key as keyof typeof form]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d4a017] transition-colors">
                          {["PIECE", "BOTTLE", "BOX", "SET"].map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      ) : (
                        <input type={type === "number" ? "number" : "text"} placeholder={placeholder}
                          value={form[key as keyof typeof form]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#d4a017] transition-colors" />
                      )}
                    </div>
                  ))}
                  <button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.name}
                    className="w-full bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-40 text-black font-bold py-3 rounded-xl transition-colors">
                    {addMutation.isPending ? "Adding..." : "Add Item"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
