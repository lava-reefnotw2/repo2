"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Bell, ChevronRight, Menu, Moon, Sun } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNotificacionesPendientes } from "@/hooks/useNotificacionesPendientes";

const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
};

export function Navbar({
  sidebarCollapsed,
  onToggleMobileSidebar,
  breadcrumbs,
}: {
  sidebarCollapsed: boolean;
  onToggleMobileSidebar: () => void;
  breadcrumbs: Array<{ href: string; label: string }>;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { notificacionesPendientes } = useNotificacionesPendientes();

  const userLabel = session?.user?.name || session?.user?.email || "Usuario";
  const initials = getInitials(userLabel);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full border-b",
        "bg-[color:var(--unt-card)]/60 backdrop-blur-xl",
        "border-white/30 dark:border-white/10"
      )}
      aria-label="Barra superior"
    >
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className={cn(
              "inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-xl border",
              "bg-white/40 hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10",
              "border-white/30 dark:border-white/10 transition-colors"
            )}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5 text-[color:var(--unt-text)]" />
          </button>

          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex min-w-0 items-center gap-2 text-sm">
              {breadcrumbs.map((b, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li key={b.href} className="flex min-w-0 items-center gap-2">
                    {idx > 0 && <ChevronRight className="h-4 w-4 text-[color:var(--unt-text-muted)]" />}
                    {isLast ? (
                      <span className="min-w-0 truncate font-semibold text-[color:var(--unt-text)]" aria-current="page">
                        {b.label}
                      </span>
                    ) : (
                      <Link
                        href={b.href}
                        className="min-w-0 truncate text-[color:var(--unt-text-muted)] hover:text-[color:var(--unt-accent-indigo)] transition-colors"
                      >
                        {b.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="mt-0.5 text-xs text-[color:var(--unt-text-muted)]">
              {pathname.startsWith("/dashboard") ? "Panel de administración" : ""}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border",
              "bg-white/40 hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10",
              "border-white/30 dark:border-white/10 transition-colors"
            )}
            aria-label="Cambiar tema"
          >
            <Sun
              className={cn(
                "absolute h-5 w-5 text-[color:var(--unt-accent-indigo)] transition-all duration-300",
                theme === "dark" ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
              )}
            />
            <Moon
              className={cn(
                "absolute h-5 w-5 text-[color:var(--unt-accent-violet)] transition-all duration-300",
                theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
              )}
            />
          </button>

          <button
            type="button"
            className={cn(
              "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border",
              "bg-white/40 hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10",
              "border-white/30 dark:border-white/10 transition-colors"
            )}
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5 text-[color:var(--unt-text)]" />
            {notificacionesPendientes > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[color:var(--unt-accent-violet)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {notificacionesPendientes}
              </span>
            )}
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors",
                  "bg-white/40 hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10",
                  "border-white/30 dark:border-white/10"
                )}
                aria-label="Menú de usuario"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--unt-pastel-sky)] to-[color:var(--unt-pastel-lavender)] text-sm font-extrabold text-[color:var(--unt-accent-indigo)]">
                  {initials}
                </span>
                <span className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-[color:var(--unt-text)] leading-tight">{userLabel}</div>
                  <div className="text-xs text-[color:var(--unt-text-muted)]">{sidebarCollapsed ? "" : session?.user?.role ?? ""}</div>
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 border-white/30 dark:border-white/10 bg-[color:var(--unt-card)]/90 backdrop-blur-xl">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[color:var(--unt-text)]">{userLabel}</div>
                <div className="text-xs text-[color:var(--unt-text-muted)]">{session?.user?.email ?? ""}</div>
                <div className="h-px bg-black/10 dark:bg-white/10 my-2" />
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  Perfil
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  Configuración
                </button>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
