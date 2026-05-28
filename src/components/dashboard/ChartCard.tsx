"use client";

import { cn } from "@/lib/utils";

export function ChartCard({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/30 dark:border-white/10",
        "bg-[color:var(--unt-card)]/70 dark:bg-[color:var(--unt-card)]/75",
        "backdrop-blur-xl shadow-[var(--unt-shadow-card)]",
        "transition-colors",
        className
      )}
      aria-label={title}
    >
      <div className="flex items-start justify-between gap-3 px-5 pb-0 pt-5">
        <div className="min-w-0">
          <h3 className="font-display text-base font-extrabold text-[color:var(--unt-text)] truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-sm text-[color:var(--unt-text-muted)]">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </section>
  );
}

