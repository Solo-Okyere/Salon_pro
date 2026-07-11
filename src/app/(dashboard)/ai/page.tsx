"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Users, TrendingDown, AlertTriangle, Sparkles, RefreshCw, MessageSquare } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message { role: "user" | "assistant"; content: string }

interface AtRiskCustomer {
  id: string; name: string; phone: string;
  lastVisitDays: number; totalVisits: number; totalSpent: number;
  tier: string; riskScore: number; riskLevel: string;
}

interface RetentionData {
  atRisk: AtRiskCustomer[];
  insights: Array<{ type: string; title: string; body: string; priority: string }>;
  summary: { totalAtRisk: number; critical: number; high: number; medium: number };
}

const PROMPTS = [
  "How can I increase revenue this week?",
  "What's my no-show situation?",
  "Which customers should I focus on retaining?",
  "Give me 3 actionable tips for my shop",
  "How are my top services performing?",
];

const RISK_COLOR: Record<string, string> = {
  CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
  HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export default function AIPage() {
  const [tab, setTab] = useState<"assistant" | "retention">("assistant");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm SalonPro AI, your business intelligence assistant. I have access to your shop data and can help you grow your business. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: retention, isLoading: loadingRetention } = useQuery<RetentionData>({
    queryKey: ["retention"],
    queryFn: () => api.get("/api/ai/retention").then((r) => r.data.data),
    enabled: tab === "retention",
  });

  const chatMutation = useMutation({
    mutationFn: (message: string) => api.post("/api/ai/assistant", {
      message,
      history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    }),
    onSuccess: (res) => {
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    },
  });

  const sendMessage = (msg?: string) => {
    const text = msg ?? input;
    if (!text.trim() || chatMutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    chatMutation.mutate(text);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#d4a017]/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#d4a017]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Business Intelligence</h1>
            <p className="text-white/60 text-sm">Powered by SalonPro AI</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111] border border-white/10 rounded-xl p-1 w-fit">
          <button onClick={() => setTab("assistant")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === "assistant" ? "bg-[#d4a017] text-black" : "text-white/50 hover:text-white")}>
            <Bot className="w-4 h-4" /> AI Assistant
          </button>
          <button onClick={() => setTab("retention")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === "retention" ? "bg-[#d4a017] text-black" : "text-white/50 hover:text-white")}>
            <Users className="w-4 h-4" /> Customer Retention
          </button>
        </div>

        {/* AI Chat */}
        {tab === "assistant" && (
          <div className="flex flex-col gap-4">
            {/* Quick Prompts */}
            <div className="flex gap-2 flex-wrap">
              {PROMPTS.map((p) => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="text-xs bg-[#111] border border-white/10 hover:border-[#d4a017]/40 px-3 py-1.5 rounded-full transition-colors text-white/60 hover:text-white">
                  {p}
                </button>
              ))}
            </div>

            {/* Chat Window */}
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[500px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 bg-[#d4a017]/10 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-[#d4a017]" />
                      </div>
                    )}
                    <div className={cn("max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-[#d4a017] text-black rounded-tr-sm"
                        : "bg-[#1a1a1a] text-white/90 rounded-tl-sm")}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 bg-[#d4a017]/10 rounded-lg flex items-center justify-center mr-2 flex-shrink-0">
                      <Bot className="w-4 h-4 text-[#d4a017]" />
                    </div>
                    <div className="bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-2 h-2 bg-[#d4a017] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-white/10 p-3 flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Ask about your business..."
                  className="flex-1 bg-[#080808] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#d4a017] transition-colors" />
                <button onClick={() => sendMessage()} disabled={!input.trim() || chatMutation.isPending}
                  className="w-10 h-10 bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-40 text-black rounded-xl flex items-center justify-center transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Retention Dashboard */}
        {tab === "retention" && (
          <div className="space-y-6">
            {loadingRetention ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Critical Risk", value: retention?.summary.critical ?? 0, color: "text-red-400" },
                    { label: "High Risk", value: retention?.summary.high ?? 0, color: "text-orange-400" },
                    { label: "Medium Risk", value: retention?.summary.medium ?? 0, color: "text-yellow-400" },
                  ].map((m) => (
                    <div key={m.label} className="bg-[#111] border border-white/10 rounded-xl p-4 text-center">
                      <p className={cn("text-2xl font-bold", m.color)}>{m.value}</p>
                      <p className="text-xs text-white/60">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Insights */}
                {(retention?.insights ?? []).length > 0 && (
                  <div className="space-y-3">
                    {retention?.insights.map((insight, i) => (
                      <div key={i} className={cn("border rounded-xl p-4",
                        insight.priority === "HIGH" ? "bg-red-500/5 border-red-500/20" :
                          insight.priority === "MEDIUM" ? "bg-yellow-500/5 border-yellow-500/20" : "bg-white/5 border-white/10")}>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className={cn("w-4 h-4",
                            insight.priority === "HIGH" ? "text-red-400" : insight.priority === "MEDIUM" ? "text-yellow-400" : "text-white/50")} />
                          <span className="font-semibold text-sm">{insight.title}</span>
                        </div>
                        <p className="text-sm text-white/60">{insight.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* At-Risk Customers */}
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-400" /> At-Risk Customers
                  </h2>
                  {(retention?.atRisk ?? []).length === 0 ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                      <p className="text-green-400 font-semibold">Great retention!</p>
                      <p className="text-sm text-white/50 mt-1">No customers at significant churn risk right now.</p>
                    </div>
                  ) : (
                    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                      {retention?.atRisk.slice(0, 20).map((c, i) => (
                        <div key={c.id} className={cn("flex items-center justify-between p-4", i > 0 && "border-t border-white/5")}>
                          <div>
                            <p className="font-medium text-sm">{c.name}</p>
                            <p className="text-xs text-white/60">{c.phone} · {c.totalVisits} visits · GHS {c.totalSpent.toFixed(0)} spent</p>
                          </div>
                          <div className="flex items-center gap-3 text-right">
                            <div>
                              <p className="text-xs text-white/60">{c.lastVisitDays === 999 ? "Never" : `${c.lastVisitDays}d ago`}</p>
                              <span className={cn("text-xs px-2 py-0.5 rounded-full border", RISK_COLOR[c.riskLevel])}>
                                {c.riskLevel}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
