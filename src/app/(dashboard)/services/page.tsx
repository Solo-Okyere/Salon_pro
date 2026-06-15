"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Scissors, Clock, DollarSign, X, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Service {
  id: string; name: string; description: string | null;
  price: number; depositAmount: number; durationMinutes: number;
  isActive: boolean; shopId: string;
}

const emptyForm = { name: "", description: "", price: "", depositAmount: "0", durationMinutes: "30" };

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: shopData } = useQuery({
    queryKey: ["shop-settings"],
    queryFn: () => api.get("/api/shops/settings").then((r) => r.data.data),
  });

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["services", shopData?.id],
    queryFn: () => api.get(`/api/services?shopId=${shopData!.id}`).then((r) => r.data.data),
    enabled: !!shopData?.id,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/api/services", {
      name: form.name,
      description: form.description || undefined,
      price: parseFloat(form.price),
      depositAmount: parseFloat(form.depositAmount) || 0,
      durationMinutes: parseInt(form.durationMinutes),
    }),
    onSuccess: () => {
      toast.success("Service created");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: () => toast.error("Failed to create service"),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/api/services/${editing!.id}`, {
      name: form.name,
      description: form.description || undefined,
      price: parseFloat(form.price),
      depositAmount: parseFloat(form.depositAmount) || 0,
      durationMinutes: parseInt(form.durationMinutes),
    }),
    onSuccess: () => {
      toast.success("Service updated");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: () => toast.error("Failed to update service"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/services/${id}`),
    onSuccess: () => {
      toast.success("Service removed");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: () => toast.error("Failed to remove service"),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      price: s.price.toString(),
      depositAmount: s.depositAmount.toString(),
      durationMinutes: s.durationMinutes.toString(),
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const canSubmit = form.name.trim().length >= 2 && parseFloat(form.price) > 0 && parseInt(form.durationMinutes) >= 5;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{services?.length ?? 0} services offered</p>
        </div>
        <button onClick={openCreate} className="btn-gold flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !services?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Scissors className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No services yet</p>
          <p className="text-sm mt-1">Add your first service to start accepting bookings</p>
          <button onClick={openCreate} className="mt-4 btn-gold px-5 py-2 rounded-xl text-sm font-semibold">
            Add Service
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-card"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Scissors className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{s.name}</p>
                {s.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{s.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3" /> {formatCurrency(s.price)}
                  </span>
                  {s.depositAmount > 0 && (
                    <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-100 px-1.5 py-0.5 rounded">
                      Deposit: {formatCurrency(s.depositAmount)}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {s.durationMinutes}min
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(s)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setDeleteId(s.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-dropdown"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-foreground">
                  {editing ? "Edit Service" : "New Service"}
                </h3>
                <button onClick={closeModal} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Service Name *</label>
                  <input value={form.name} onChange={set("name")} className="input-base w-full" placeholder="e.g. Fresh Cut" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                  <input value={form.description} onChange={set("description")} className="input-base w-full" placeholder="Optional short description" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Price (GHS) *</label>
                    <input value={form.price} onChange={set("price")} type="number" min="0" step="0.01" className="input-base w-full" placeholder="50.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Deposit (GHS)</label>
                    <input value={form.depositAmount} onChange={set("depositAmount")} type="number" min="0" step="0.01" className="input-base w-full" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Duration (minutes) *</label>
                  <input value={form.durationMinutes} onChange={set("durationMinutes")} type="number" min="5" max="480" className="input-base w-full" placeholder="30" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeModal} className="flex-1 btn-outline py-2.5 rounded-xl text-sm font-semibold">
                  Cancel
                </button>
                <button
                  onClick={() => editing ? updateMutation.mutate() : createMutation.mutate()}
                  disabled={isSubmitting || !canSubmit}
                  className="flex-1 btn-gold py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? "Save Changes" : "Create Service"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-dropdown"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Remove Service</h3>
                  <p className="text-sm text-muted-foreground">This service will be deactivated</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 btn-outline py-2 rounded-xl text-sm font-semibold">
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteId)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
