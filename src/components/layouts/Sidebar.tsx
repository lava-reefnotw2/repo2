import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SidebarItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export function Sidebar({
  items,
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: {
  items: SidebarItem[];
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onCloseMobile}
        aria-hidden={!mobileOpen}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r transition-[width,transform] duration-300 ease-out",
          "bg-[color:var(--unt-card)]/70 backdrop-blur-xl shadow-[var(--unt-shadow-card)]",
          "dark:bg-[color:var(--unt-card)]/80",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Barra lateral"
      >
        <div className="flex h-16 items-center justify-between px-3">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <img src="/logo-unt.png" alt="UNT" className="h-9 w-9 rounded-xl" />
            <div className={cn("min-w-0", collapsed && "hidden")}>
              <div className="font-display text-sm font-extrabold leading-tight text-[color:var(--unt-text)]">
                Horarios UNT
              </div>
              <div className="text-xs text-[color:var(--unt-text-muted)]">Gestión académica</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
              "bg-white/50 hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10",
              "border-white/40 dark:border-white/10"
            )}
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <span className={cn("block h-3 w-3 rotate-45 border-r-2 border-b-2", collapsed ? "rotate-[225deg]" : "rotate-45")} />
          </button>
        </div>

        <nav className="px-2 pb-6 pt-2">
          <ul className="space-y-1">
            {items.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--unt-accent-indigo)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--unt-bg)]",
                      active
                        ? "bg-[color:var(--unt-pastel-sky)]/50 text-[color:var(--unt-accent-indigo)] dark:bg-white/10"
                        : "text-[color:var(--unt-text)] hover:bg-black/5 dark:text-[color:var(--unt-text)] dark:hover:bg-white/10"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "absolute inset-y-1 left-1 w-0 rounded-full bg-[color:var(--unt-pastel-mint)]/60 transition-[width] duration-300 ease-out",
                        active ? "w-1.5" : "group-hover:w-1.5"
                      )}
                    />
                    <Icon className={cn("h-5 w-5 flex-none", active ? "text-[color:var(--unt-accent-indigo)]" : "text-[color:var(--unt-text-muted)]")} />
                    <span className={cn("min-w-0 flex-1 truncate", collapsed && "hidden")}>{item.label}</span>
                    {typeof item.badge === "number" && item.badge > 0 && !collapsed && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[color:var(--unt-accent-violet)] px-2 py-0.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
