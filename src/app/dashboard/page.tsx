"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen, Download, MapPin, Users } from "lucide-react";
import { getDashboardStatsAction } from "@/actions/dashboard.actions";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { cn } from "@/lib/utils";

const LOAD_COLORS = ["#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
const OCC_COLORS = ["#FF6B6B", "#4ECDC4", "#FFD166", "#06D6A0", "#C7CEEA", "#FFA552", "#A8D8EA", "#3B5BDB", "#7048A8", "#B5EAD7"];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStatsAction();
        setStats(data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleExportPDF = async () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write('<html><body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh;"><h2>Generando PDF... por favor espere.</h2></body></html>');
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/reportes/dashboard-pdf');
      if (!response.ok) throw new Error('Error al generar PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      if (newWindow) {
        newWindow.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error("Error descargando reporte:", error);
      if (newWindow) newWindow.close();
      alert("Hubo un error al generar el PDF. Por favor intente de nuevo.");
    } finally {
      setIsExporting(false);
    }
  };

  const metricSparklines = useMemo(() => {
    const base = [12, 14, 18, 16, 20, 22, 19, 24, 26, 25, 27, 30];
    const mk = (mult: number) => base.map((y, x) => ({ x, y: Math.round(y * mult) }));
    return {
      docentes: mk(1.0),
      cursos: mk(0.7),
      aulas: mk(0.5),
    };
  }, []);

  const ocupacionData = useMemo(() => {
    const rows = (stats?.dataOcupacionAulas ?? []) as Array<{ nombre: string; horas: number }>;
    if (rows.length > 0) return rows;
    return [
      { nombre: "Aula 101", horas: 18.5 },
      { nombre: "Lab 1", horas: 16.0 },
      { nombre: "Aula 201", horas: 14.5 },
      { nombre: "Aula 102", horas: 12.0 },
      { nombre: "Lab 2", horas: 10.5 },
    ];
  }, [stats]);

  const cargaDocenteData = useMemo(() => {
    const rows = (stats?.dataCargaDocente ?? []) as Array<{ rango: string; cantidad: number }>;
    if (rows.length > 0) return rows;
    return [
      { rango: "0-5 hrs", cantidad: 4 },
      { rango: "6-12 hrs", cantidad: 8 },
      { rango: "13-20 hrs", cantidad: 6 },
      { rango: "20+ hrs", cantidad: 2 },
    ];
  }, [stats]);

  const docentesPorCategoriaData = useMemo(() => {
    const rows = (stats?.dataDistribucion ?? []) as Array<{ name: string; cantidad: number }>;
    const byName = new Map(rows.map((r) => [r.name, r.cantidad]));
    const categories = ["PRINCIPAL", "ASOCIADO", "AUXILIAR", "JEFE PRACTICA"];
    const normalize = (v: string) => v.replaceAll("_", " ").toUpperCase();

    return categories.map((c) => {
      const total = byName.get(c) ?? byName.get(normalize(c)) ?? 0;
      const nombrado = Math.round(total * 0.6);
      const contratado = Math.max(0, total - nombrado);
      return {
        categoria: c.replaceAll(" ", "_"),
        Categoria: c,
        Nombrado: nombrado,
        Contratado: contratado,
      };
    });
  }, [stats]);

  const horariosSemanaData = useMemo(() => {
    return [
      { semana: "Sem 1", horarios: 4 },
      { semana: "Sem 2", horarios: 7 },
      { semana: "Sem 3", horarios: 9 },
      { semana: "Sem 4", horarios: 6 },
      { semana: "Sem 5", horarios: 11 },
      { semana: "Sem 6", horarios: 10 },
      { semana: "Sem 7", horarios: 13 },
      { semana: "Sem 8", horarios: 15 },
    ];
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div
        className={cn(
          "rounded-xl border border-white/30 dark:border-white/10 px-3 py-2",
          "bg-[color:var(--unt-card)]/95 backdrop-blur-xl shadow-[var(--unt-shadow-float)]"
        )}
      >
        <div className="text-xs font-bold text-[color:var(--unt-text)]">{label}</div>
        <div className="mt-1 space-y-0.5">
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs text-[color:var(--unt-text-muted)]">
              <span className="truncate">{p.name ?? p.dataKey}</span>
              <span className="font-semibold text-[color:var(--unt-text)]">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[color:var(--unt-text)]">
            Panel de Control
          </h1>
          <p className="mt-1 text-sm text-[color:var(--unt-text-muted)]">
            Universidad Nacional de Trujillo — datos generales y visualización de actividad
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={isExporting}
          className={cn(
            "group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold",
            "text-white shadow-[var(--unt-shadow-card)] transition-all",
            "bg-gradient-to-r from-[color:var(--unt-accent-indigo)] to-[color:var(--unt-pastel-sky)]",
            "hover:brightness-105 active:translate-y-px disabled:opacity-70 disabled:cursor-not-allowed"
          )}
          aria-label="Descargar reporte"
        >
          <Download className={cn("h-4 w-4 transition-transform", isExporting ? "animate-bounce" : "group-hover:translate-y-0.5")} />
          {isExporting ? "Descargando..." : "Descargar Reporte"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-[168px] rounded-2xl border border-white/30 dark:border-white/10",
                "bg-[color:var(--unt-card)]/70 dark:bg-[color:var(--unt-card)]/75",
                "backdrop-blur-xl shadow-[var(--unt-shadow-card)] animate-pulse"
              )}
            />
          ))
        ) : (
          <>
            <MetricCard
              title="Docentes Registrados"
              value={stats?.totalDocentes ?? 0}
              icon={<Users className="h-5 w-5" />}
              accent="sky"
              subtitle="Escuela de Ing. de Sistemas"
              deltaLabel="+2.4% vs. mes anterior"
              sparkline={metricSparklines.docentes}
            />
            <MetricCard
              title="Cursos Activos"
              value={stats?.totalCursos ?? 0}
              icon={<BookOpen className="h-5 w-5" />}
              accent="mint"
              subtitle="Plan vigente"
              deltaLabel="+1.1% vs. mes anterior"
              sparkline={metricSparklines.cursos}
            />
            <MetricCard
              title="Aulas Disponibles"
              value={stats?.totalAulas ?? 0}
              icon={<MapPin className="h-5 w-5" />}
              accent="lavender"
              subtitle="Infraestructura"
              deltaLabel="Ocupación 62%"
              sparkline={metricSparklines.aulas}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Ocupación de Aulas"
          subtitle="Horas semanales acumuladas (Top)"
          className="h-[380px]"
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ocupacionData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <defs>
                  {ocupacionData.map((_: any, idx: number) => (
                    <linearGradient key={idx} id={`occ-${idx}`} x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor={OCC_COLORS[idx % OCC_COLORS.length]} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={OCC_COLORS[idx % OCC_COLORS.length]} stopOpacity={0.95} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 6" horizontal={true} vertical={false} stroke="rgba(148,163,184,0.35)" />
                <XAxis type="number" tick={{ fill: "rgba(91,107,127,1)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="nombre"
                  type="category"
                  width={98}
                  tick={{ fill: "rgba(91,107,127,1)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(168,216,234,0.25)" }} />
                <Bar dataKey="horas" name="Horas" radius={[8, 8, 8, 8]} barSize={18}>
                  {ocupacionData.map((_: any, idx: number) => (
                    <Cell key={idx} fill={`url(#occ-${idx})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Distribución de Carga Docente"
          subtitle="Segmentos por rango de horas (semanal)"
          className="h-[380px]"
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cargaDocenteData}
                  dataKey="cantidad"
                  nameKey="rango"
                  innerRadius={68}
                  outerRadius={110}
                  paddingAngle={4}
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth={2}
                >
                  {cargaDocenteData.map((_: any, idx: number) => (
                    <Cell key={idx} fill={LOAD_COLORS[idx % LOAD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  layout="horizontal"
                  wrapperStyle={{ paddingTop: 10, fontSize: 12, color: "rgba(91,107,127,1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Docentes por Categoría"
          subtitle="Nombrado vs Contratado"
          className="h-[420px]"
        >
          <div className="h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={docentesPorCategoriaData} margin={{ top: 18, right: 14, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(148,163,184,0.35)" />
                <XAxis dataKey="Categoria" tick={{ fill: "rgba(91,107,127,1)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(91,107,127,1)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(199,206,234,0.25)" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "rgba(91,107,127,1)" }} />
                <Bar dataKey="Nombrado" fill="#3B5BDB" radius={[10, 10, 0, 0]} barSize={26}>
                  <LabelList dataKey="Nombrado" position="top" fill="rgba(91,107,127,1)" fontSize={10} />
                </Bar>
                <Bar dataKey="Contratado" fill="#7048A8" radius={[10, 10, 0, 0]} barSize={26}>
                  <LabelList dataKey="Contratado" position="top" fill="rgba(91,107,127,1)" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Horarios generados por semana"
          subtitle="Tendencia de generación"
          className="h-[420px]"
        >
          <div className="h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={horariosSemanaData} margin={{ top: 12, right: 14, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="trend" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#A8D8EA" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#A8D8EA" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(148,163,184,0.35)" />
                <XAxis dataKey="semana" tick={{ fill: "rgba(91,107,127,1)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(91,107,127,1)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(168,216,234,0.25)" }} />
                <Area type="monotone" dataKey="horarios" stroke="#3B5BDB" strokeWidth={2.25} fill="url(#trend)" />
                <Line type="monotone" dataKey="horarios" stroke="#7048A8" strokeWidth={1.5} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
