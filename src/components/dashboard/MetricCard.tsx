"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  icon,
  accent,
  subtitle,
  deltaLabel,
  sparkline,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: "sky" | "mint" | "lavender";
  subtitle?: string;
  deltaLabel?: string;
  sparkline: Array<{ x: number; y: number }>;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const durationMs = 650;
    const start = performance.now();
    const from = 0;
    const to = Number.isFinite(value) ? value : 0;

    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedValue(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const accentClass = useMemo(() => {
    if (accent === "mint") return "from-[color:var(--unt-pastel-mint)] to-[color:var(--unt-pastel-sky)]";
    if (accent === "lavender") return "from-[color:var(--unt-pastel-lavender)] to-[color:var(--unt-pastel-sky)]";
    return "from-[color:var(--unt-pastel-sky)] to-[color:var(--unt-pastel-mint)]";
  }, [accent]);

  const stroke = useMemo(() => {
    if (accent === "mint") return "#45B7D1";
    if (accent === "lavender") return "#7048A8";
    return "#3B5BDB";
  }, [accent]);

  return (
    <section
      className={cn(
        "rounded-2xl border border-white/30 dark:border-white/10",
        "bg-[color:var(--unt-card)]/70 dark:bg-[color:var(--unt-card)]/75",
        "backdrop-blur-xl shadow-[var(--unt-shadow-card)]",
        "transition-colors overflow-hidden"
      )}
      aria-label={title}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--unt-text-muted)]">
            {title}
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold text-[color:var(--unt-text)]">
            {animatedValue}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {subtitle && <span className="text-sm text-[color:var(--unt-text-muted)]">{subtitle}</span>}
            {deltaLabel && (
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-[color:var(--unt-text)] dark:bg-white/10">
                {deltaLabel}
              </span>
            )}
          </div>
        </div>
        <div className={cn("inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br", accentClass)}>
          <div className="text-[color:var(--unt-accent-indigo)]">{icon}</div>
        </div>
      </div>

      <div className="mt-3 h-16 px-4 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkline}>
            <Line type="monotone" dataKey="y" stroke={stroke} strokeWidth={2.25} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

