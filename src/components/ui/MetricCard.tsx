"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Animated counter ──────────────────────────────────────────────────────────
export function Count({
  to,
  prefix = "",
  suffix = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
}) {
  const [n, setN] = useState(0);
  const el = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    done.current = false;
    setN(0);
  }, [to]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !done.current) {
          done.current = true;
          const dur = 1200;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min((t - t0) / dur, 1);
            setN(Math.round((1 - Math.pow(1 - p, 3)) * to));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (el.current) obs.observe(el.current);
    return () => obs.disconnect();
  }, [to]);

  return (
    <span ref={el}>
      {prefix}
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────
export interface MetricCardProps {
  label: string;
  /** The numeric value to animate to */
  rawValue: number;
  prefix?: string;
  suffix?: string;
  /** Lucide icon component */
  icon: React.ElementType;
  /** Tailwind class(es) for the icon chip background, e.g. "bg-blue-50" */
  iconBg: string;
  /** CSS colour for the icon SVG stroke, e.g. "#2563eb" */
  iconColor: string;
  /** Trend badge text, e.g. "+12%" — omit to hide the badge */
  trend?: string;
  /** Secondary line below the label, e.g. "vs last week" */
  trendSub?: string;
  /** true = green up-arrow, false = red down-arrow (ignored when trend is absent) */
  trendUp?: boolean;
  /** Framer-motion entrance delay in seconds */
  delay?: number;
}

export function MetricCard({
  label,
  rawValue,
  prefix = "",
  suffix = "",
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendSub,
  trendUp,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className="metric-card card-lift"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
            iconBg
          )}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} />
        </div>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
              trendUp
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            )}
          >
            {trendUp ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend}
          </span>
        )}
      </div>

      <div className="text-2xl font-bold text-foreground tracking-tight">
        <Count to={rawValue} prefix={prefix} suffix={suffix} />
      </div>

      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {trendSub && (
          <span className="text-xs text-muted-foreground truncate">
            {trendSub}
          </span>
        )}
      </div>
    </motion.div>
  );
}
