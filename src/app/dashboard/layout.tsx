"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { Sidebar, type SidebarItem } from "@/components/layouts/Sidebar";
import { Navbar } from "@/components/layouts/Navbar";
import { useNotificacionesPendientes } from "@/hooks/useNotificacionesPendientes";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { notificacionesPendientes } = useNotificacionesPendientes();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("unt.sidebarCollapsed");
    if (stored === "1") setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("unt.sidebarCollapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const navItems: SidebarItem[] = useMemo(
    () => [
      { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
      { href: "/dashboard/docentes", label: "Docentes", icon: Users },
      { href: "/dashboard/cursos", label: "Cursos", icon: BookOpen },
      { href: "/dashboard/ambientes", label: "Ambientes", icon: MapPin },
      { href: "/dashboard/horarios", label: "Horarios", icon: Calendar },
      { href: "/dashboard/horarios/generador", label: "Generar Horarios", icon: Sparkles },
      { href: "/dashboard/reportes/gestion", label: "Reporte de Gestión", icon: GraduationCap, badge: notificacionesPendientes },
    ],
    [notificacionesPendientes]
  );

  const breadcrumbs = useMemo(() => {
    const labelByHref = new Map(navItems.map((i) => [i.href, i.label]));
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: Array<{ href: string; label: string }> = [{ href: "/dashboard", label: "Inicio" }];

    if (segments.length <= 1) return crumbs;

    const buildHref = (count: number) => `/${segments.slice(0, count).join("/")}`;
    for (let i = 2; i <= segments.length; i++) {
      const href = buildHref(i);
      if (!href.startsWith("/dashboard")) continue;
      const label = labelByHref.get(href) ?? segments[i - 1].replaceAll("-", " ");
      if (!crumbs.some((c) => c.href === href)) crumbs.push({ href, label });
    }
    return crumbs;
  }, [pathname, navItems]);

  return (
    <div className="min-h-screen bg-[color:var(--unt-bg)] transition-colors">
      <Sidebar
        items={navItems}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div
        className={cn(
          "transition-[padding] duration-300 ease-out",
          "pl-0",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-60"
        )}
      >
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          breadcrumbs={breadcrumbs}
        />
        <main className="px-4 pb-10 pt-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
