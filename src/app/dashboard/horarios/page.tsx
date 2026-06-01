"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { trpc } from "@/components/TRPCProvider";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { TipoAmbiente } from "@prisma/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, Calendar, Loader2, Plus, Clock, MapPin, User, BookOpen, AlertCircle, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const HORAS = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

const COLORS = [
  "bg-blue-100 text-blue-800 border-blue-300",
  "bg-green-100 text-green-800 border-green-300",
  "bg-amber-100 text-amber-800 border-amber-300",
  "bg-purple-100 text-purple-800 border-purple-300",
  "bg-pink-100 text-pink-800 border-pink-300",
  "bg-teal-100 text-teal-800 border-teal-300",
  "bg-indigo-100 text-indigo-800 border-indigo-300",
  "bg-rose-100 text-rose-800 border-rose-300",
  "bg-cyan-100 text-cyan-800 border-cyan-300",
];

export default function HorariosPage() {
  const [modoVista, setModoVista] = useState<"DOCENTE" | "CICLO" | "AULA">("CICLO");
  const [semestre, setSemestre] = useState("2026-II");
  const [escuela, setEscuela] = useState("Ingeniería de Sistemas");
  const [docenteFiltro, setDocenteFiltro] = useState("Todos");
  const [ciclo, setCiclo] = useState<string>("Todos");
  const [grupoFiltro, setGrupoFiltro] = useState("Todos");
  const [tipoFiltro, setTipoFiltro] = useState<"Todos" | TipoAmbiente>("Todos");
  const [aulaFiltro, setAulaFiltro] = useState<string>("Todos");
  const [laboratorioFiltro, setLaboratorioFiltro] = useState<string>("Todos");
  const [selectedAsignacion, setSelectedAsignacion] = useState<any | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: periodos } = trpc.periodo.list.useQuery();
  const { data: docentesAll } = trpc.docente.list.useQuery();
  const { data: aulasAll } = trpc.ambiente.listByTipo.useQuery({ tipo: TipoAmbiente.AULA });
  const { data: laboratoriosAll } = trpc.ambiente.listByTipo.useQuery({ tipo: TipoAmbiente.LABORATORIO });

  // Extraer TODAS las asignaciones de este Semestre y Escuela
  const { data: asignacionesRaw, isLoading, refetch } = trpc.asignacion.listBySemestreEscuela.useQuery(
    { semestre, escuela }
  );

  const deleteAsignacion = trpc.asignacion.delete.useMutation({
    onSuccess: () => {
      toast.success("Asignación eliminada correctamente");
      setSelectedAsignacion(null);
      refetch();
    },
    onError: (err: any) => toast.error(err.message || "Error al eliminar la asignación"),
    onSettled: () => setIsDeleting(false)
  });

  const handleDelete = () => {
    if (!selectedAsignacion) return;
    if (confirm("¿Estás seguro de eliminar este bloque de horario?")) {
      setIsDeleting(true);
      deleteAsignacion.mutate({ id: selectedAsignacion.id });
    }
  };

  const isModoDocente = modoVista === "DOCENTE";

  const semestresDisponibles = useMemo(() => {
    const parse = (s: string) => {
      const m = s.match(/^(\d{4})-(I|II)$/);
      if (!m) return { year: 0, term: 0 };
      const year = Number(m[1]);
      const term = m[2] === "II" ? 2 : 1;
      return { year, term };
    };

    const unique = new Set<string>();
    (periodos ?? []).forEach((p: any) => {
      if (typeof p?.semestre === "string") unique.add(p.semestre);
    });

    const list = Array.from(unique);
    list.sort((a, b) => {
      const pa = parse(a);
      const pb = parse(b);
      if (pa.year !== pb.year) return pb.year - pa.year;
      return pb.term - pa.term;
    });
    return list;
  }, [periodos]);

  const escuelasDisponibles = useMemo(() => {
    const unique = new Set<string>();
    (periodos ?? []).forEach((p: any) => {
      if (typeof p?.escuela === "string") unique.add(p.escuela);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [periodos]);

  const ciclosDisponibles = useMemo(() => {
    if (semestre.endsWith("-I")) return [1, 3, 5, 7, 9];
    if (semestre.endsWith("-II")) return [2, 4, 6, 8, 10];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }, [semestre]);

  const ciclosPorDocente = useMemo(() => {
    if (docenteFiltro === "Todos") return null;
    if (!asignacionesRaw) return [];
    const unique = new Set<number>();
    asignacionesRaw.forEach((a: any) => {
      if (a.docenteId !== docenteFiltro) return;
      const c = a?.grupo?.curso?.ciclo;
      if (typeof c === "number") unique.add(c);
    });
    return Array.from(unique).sort((a, b) => a - b);
  }, [asignacionesRaw, docenteFiltro]);

  const ciclosPermitidos = useMemo(() => {
    if (docenteFiltro === "Todos") return ciclosDisponibles;
    if (!ciclosPorDocente) return ciclosDisponibles;
    return ciclosDisponibles.filter((c) => ciclosPorDocente.includes(c));
  }, [ciclosDisponibles, ciclosPorDocente, docenteFiltro]);

  const cicloEsValido = useMemo(() => {
    if (ciclo === "Todos") return true;
    const parsed = Number(ciclo);
    if (!Number.isFinite(parsed)) return false;
    return ciclosPermitidos.includes(parsed);
  }, [ciclo, ciclosPermitidos]);

  const aulasDisponibles = useMemo(() => {
    if (!aulasAll) return [];
    return aulasAll;
  }, [aulasAll]);

  const laboratoriosDisponibles = useMemo(() => {
    if (!laboratoriosAll) return [];
    return laboratoriosAll;
  }, [laboratoriosAll]);

  useEffect(() => {
    if (semestresDisponibles.length === 0) return;
    if (!semestresDisponibles.includes(semestre)) setSemestre(semestresDisponibles[0]);
  }, [semestresDisponibles, semestre]);

  useEffect(() => {
    if (escuelasDisponibles.length === 0) return;
    if (!escuelasDisponibles.includes(escuela)) setEscuela(escuelasDisponibles[0]);
  }, [escuelasDisponibles, escuela]);

  // Poblar el combobox de docentes desde backend (fallback: docentes presentes en asignaciones)
  const docentesDisponibles = useMemo(() => {
    if (docentesAll && docentesAll.length > 0) {
      return docentesAll.map((d: any) => ({ id: d.id, nombre: d.usuario.nombre }));
    }
    if (!asignacionesRaw) return [];
    const uniqueMap = new Map();
    asignacionesRaw.forEach((a: any) => {
      if (a.docente && !uniqueMap.has(a.docenteId)) {
        uniqueMap.set(a.docenteId, a.docente.usuario.nombre);
      }
    });
    return Array.from(uniqueMap.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [docentesAll, asignacionesRaw]);

  const gruposDisponibles = useMemo(() => {
    if (!asignacionesRaw) return [];
    const unique = new Set<string>();
    asignacionesRaw.forEach((a: any) => {
      const nombre = a?.grupo?.nombre;
      const c = a?.grupo?.curso?.ciclo;
      if (typeof nombre !== "string") return;
      if (ciclo === "Todos") {
        unique.add(nombre);
        return;
      }
      const parsed = Number(ciclo);
      if (Number.isFinite(parsed) && Number(c) === parsed) unique.add(nombre);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [asignacionesRaw, ciclo]);

  // Al cambiar la carrera o semestre, reiniciamos el docente para evitar fantasmas
  useEffect(() => {
    setDocenteFiltro("Todos");
    setGrupoFiltro("Todos");
    setAulaFiltro("Todos");
    setLaboratorioFiltro("Todos");
  }, [semestre, escuela]);

  useEffect(() => {
    if (modoVista === "DOCENTE") {
      setCiclo("Todos");
      setGrupoFiltro("Todos");
      setTipoFiltro("Todos");
      setAulaFiltro("Todos");
      setLaboratorioFiltro("Todos");
    } else if (modoVista === "CICLO") {
      setDocenteFiltro("Todos");
      setTipoFiltro("Todos");
      setAulaFiltro("Todos");
      setLaboratorioFiltro("Todos");
    } else if (modoVista === "AULA") {
      setDocenteFiltro("Todos");
      setCiclo("Todos");
      setGrupoFiltro("Todos");
      if (tipoFiltro === "Todos") setTipoFiltro("AULA");
    }
  }, [modoVista]);

  useEffect(() => {
    if (ciclo === "Todos") return;
    const parsed = Number(ciclo);
    if (!Number.isFinite(parsed)) {
      setCiclo("Todos");
      return;
    }
    if (!ciclosPermitidos.includes(parsed)) setCiclo("Todos");
  }, [ciclo, ciclosPermitidos]);

  useEffect(() => {
    if (docenteFiltro === "Todos") return;
    if (ciclo === "Todos") return;
    const parsed = Number(ciclo);
    if (!Number.isFinite(parsed)) return;
    if (!ciclosPermitidos.includes(parsed)) {
      setCiclo("Todos");
      toast.message("El docente seleccionado no enseña en ese ciclo. Se ha ajustado el filtro de ciclo.");
    }
  }, [docenteFiltro, ciclo, ciclosPermitidos]);

  useEffect(() => {
    if (grupoFiltro === "Todos") return;
    if (!gruposDisponibles.includes(grupoFiltro)) setGrupoFiltro("Todos");
  }, [grupoFiltro, gruposDisponibles]);

  useEffect(() => {
    if (aulaFiltro === "Todos") return;
    const exists = aulasDisponibles.some((a: any) => a.id === aulaFiltro);
    if (!exists) {
      setAulaFiltro("Todos");
      toast.message("ℹ️ El aula seleccionada no aplica para el ciclo actual. Se ha ajustado el filtro.");
    }
  }, [aulaFiltro, aulasDisponibles]);

  useEffect(() => {
    if (laboratorioFiltro === "Todos") return;
    const exists = laboratoriosDisponibles.some((a: any) => a.id === laboratorioFiltro);
    if (!exists) {
      setLaboratorioFiltro("Todos");
      toast.message("ℹ️ El laboratorio seleccionado no aplica para el ciclo actual. Se ha ajustado el filtro.");
    }
  }, [laboratorioFiltro, laboratoriosDisponibles]);

  // Lógica inteligente de filtrado
  const asignacionesFiltradas = useMemo(() => {
    if (!asignacionesRaw) return [];

    return asignacionesRaw.filter((asig: any) => {
      if (modoVista === "DOCENTE") {
        if (docenteFiltro === "Todos") return false;
        if (asig.docenteId !== docenteFiltro) return false;
        return true;
      } else if (modoVista === "CICLO") {
        if (ciclo === "Todos") return false;
        if (asig.grupo.curso.ciclo.toString() !== ciclo) return false;
        if (grupoFiltro !== "Todos" && asig.grupo.nombre !== grupoFiltro) return false;
        return true;
      } else if (modoVista === "AULA") {
        if (tipoFiltro === "Todos") return false;
        if (asig.tipo !== tipoFiltro) return false;
        if (tipoFiltro === "AULA") {
          if (aulaFiltro === "Todos" || asig.ambienteId !== aulaFiltro) return false;
        }
        if (tipoFiltro === "LABORATORIO") {
          if (laboratorioFiltro === "Todos" || asig.ambienteId !== laboratorioFiltro) return false;
        }
        return true;
      }
      return false;
    });
  }, [asignacionesRaw, modoVista, docenteFiltro, ciclo, grupoFiltro, tipoFiltro, aulaFiltro, laboratorioFiltro]);

  const handleExportPDF = async () => {
    if (!gridRef.current) return;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write('<html><body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh;"><h2>Generando PDF... por favor espere.</h2></body></html>');
    }

    try {
      setIsExporting(true);
      toast.loading("Generando PDF, por favor espera...", { id: "pdf-toast" });
      
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(gridRef.current, {
        scale: 2, // Mejor resolución
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });
      
      // Dimensiones A4 landscape: 297 x 210 mm
      const pdfWidth = 297;
      const pdfHeight = 210;
      
      // Añadir encabezado con fondo
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.rect(0, 0, pdfWidth, 20, "F");
      
      // Dibujar borde inferior del encabezado
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.setLineWidth(0.5);
      pdf.line(0, 20, pdfWidth, 20);

      // Cargar logo de la UNT
      const logoImg = new Image();
      logoImg.src = "/logo-unt.png";
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve; // Continue if error
      });
      // Añadir logo
      pdf.addImage(logoImg, 'PNG', 14, 4, 12, 12);
      
      // Añadir título
      pdf.setFontSize(16);
      pdf.setTextColor(30, 58, 138); // blue-900
      pdf.setFont("helvetica", "bold");
      const titulo = modoVista === "DOCENTE"
        ? `Horario Docente: ${docentesDisponibles.find(d => d.id === docenteFiltro)?.nombre || "Consolidado"}` 
        : modoVista === "AULA" 
        ? `Horario Ambiente: ${tipoFiltro === "AULA" ? aulasDisponibles.find((a:any) => a.id === aulaFiltro)?.nombre : laboratoriosDisponibles.find((a:any) => a.id === laboratorioFiltro)?.nombre}`
        : `Horario Académico - ${escuela} (Ciclo ${ciclo} - Grupo ${grupoFiltro})`;
      pdf.text(titulo, 30, 12);
      
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.setFont("helvetica", "normal");
      pdf.text(`Semestre: ${semestre}`, pdfWidth - 14, 9, { align: "right" });
      pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, pdfWidth - 14, 15, { align: "right" });
      
      // Calcular dimensiones de la imagen para que encaje en 1 hoja
      const imgProps = pdf.getImageProperties(imgData);
      const margin = 10;
      const startY = 24; // Debajo del título
      
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - startY - margin;
      
      let finalImgWidth = availableWidth;
      let finalImgHeight = (imgProps.height * finalImgWidth) / imgProps.width;
      
      // Si la altura excede el espacio disponible, escalar por altura para forzar a 1 hoja
      if (finalImgHeight > availableHeight) {
        finalImgHeight = availableHeight;
        finalImgWidth = (imgProps.width * finalImgHeight) / imgProps.height;
      }
      
      // Centrar la imagen horizontalmente si se redujo el ancho
      const xOffset = margin + (availableWidth - finalImgWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, startY, finalImgWidth, finalImgHeight);
      
      const pdfUrl = pdf.output('bloburl');
      if (newWindow) {
        newWindow.location.href = pdfUrl.toString();
      } else {
        window.open(pdfUrl.toString(), '_blank');
      }
        
      toast.success("PDF exportado con éxito", { id: "pdf-toast" });
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      if (newWindow) newWindow.close();
      toast.error("Ocurrió un error al generar el PDF", { id: "pdf-toast" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    params.set("formato", "excel");
    params.set("semestre", semestre);
    params.set("escuela", escuela);
    params.set("modo", modoVista);
    if (docenteFiltro !== "Todos") params.set("docenteId", docenteFiltro);
    if (ciclo !== "Todos") params.set("ciclo", ciclo);
    if (grupoFiltro !== "Todos") params.set("grupo", grupoFiltro);
    if (tipoFiltro !== "Todos") params.set("tipo", tipoFiltro);
    if (modoVista === "AULA") {
      if (tipoFiltro === "AULA" && aulaFiltro !== "Todos") params.set("ambienteId", aulaFiltro);
      if (tipoFiltro === "LABORATORIO" && laboratorioFiltro !== "Todos") params.set("ambienteId", laboratorioFiltro);
    }
    window.open(`/api/reportes/horario-pdf?${params.toString()}`, "_blank");
  };

  const getCellAsignaciones = (dia: string, hora: string) => {
    return asignacionesFiltradas.filter((a: any) => {
      if (a.dia !== dia) return false;
      const tInicio = parseInt(a.horaInicio.split(":")[0]);
      const tFin = parseInt(a.horaFin.split(":")[0]);
      const currentH = parseInt(hora.split(":")[0]);
      return currentH >= tInicio && currentH < tFin;
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            Visualización de Horarios {isModoDocente && <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-300">Modo Docente</Badge>}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isModoDocente ? "Visualizando horario consolidado por docente" : "Consulta y gestiona los horarios por período académico"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF} disabled={isExporting || asignacionesFiltradas.length === 0}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            {isExporting ? "Generando..." : "Exportar PDF"}
          </Button>
          <Button variant="outline" onClick={handleExportExcel} disabled={asignacionesFiltradas.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setDocenteFiltro("Todos");
              setCiclo("Todos");
              setGrupoFiltro("Todos");
              setTipoFiltro("Todos");
              setAulaFiltro("Todos");
              setLaboratorioFiltro("Todos");
            }}
          >
            Limpiar filtros
          </Button>
          <Link href="/dashboard/horarios/nueva-asignacion">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Asignación
            </Button>
          </Link>
        </div>
      </div>

      {/* TARJETAS DE MODO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setModoVista("DOCENTE")}
          className={cn(
            "p-4 rounded-xl border flex items-center gap-3 transition-all text-left",
            modoVista === "DOCENTE" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
          )}
        >
          <div className={cn("p-3 rounded-lg", modoVista === "DOCENTE" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500")}>
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="font-semibold text-slate-800">Horario por Docente</div>
            <div className="text-xs text-slate-500">Visualizar la carga asignada a un profesor</div>
          </div>
        </button>

        <button
          onClick={() => setModoVista("CICLO")}
          className={cn(
            "p-4 rounded-xl border flex items-center gap-3 transition-all text-left",
            modoVista === "CICLO" ? "border-green-600 bg-green-50 ring-1 ring-green-600" : "border-slate-200 bg-white hover:border-green-300 hover:bg-slate-50"
          )}
        >
          <div className={cn("p-3 rounded-lg", modoVista === "CICLO" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500")}>
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="font-semibold text-slate-800">Horario de Ciclo</div>
            <div className="text-xs text-slate-500">Filtrar clases por ciclo y grupo de estudio</div>
          </div>
        </button>

        <button
          onClick={() => setModoVista("AULA")}
          className={cn(
            "p-4 rounded-xl border flex items-center gap-3 transition-all text-left",
            modoVista === "AULA" ? "border-amber-600 bg-amber-50 ring-1 ring-amber-600" : "border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50"
          )}
        >
          <div className={cn("p-3 rounded-lg", modoVista === "AULA" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-500")}>
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <div className="font-semibold text-slate-800">Horario de Aula / Lab</div>
            <div className="text-xs text-slate-500">Ver la ocupabilidad de los ambientes</div>
          </div>
        </button>
      </div>

      {/* FILTROS SEGÚN MODO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Semestre</label>
          <Select value={semestre} onValueChange={setSemestre}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(semestresDisponibles.length > 0 ? semestresDisponibles : ["2026-II"]).map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Carrera</label>
          <Select value={escuela} onValueChange={setEscuela}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(escuelasDisponibles.length > 0 ? escuelasDisponibles : ["Ingeniería de Sistemas", "Ingeniería Industrial", "Ingeniería Mecánica"]).map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {modoVista === "DOCENTE" && (
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium text-blue-700 flex items-center gap-1">
              <User className="h-4 w-4" /> Docente
            </label>
            <Select value={docenteFiltro} onValueChange={setDocenteFiltro}>
              <SelectTrigger className="border-blue-300 ring-blue-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Seleccionar docente...</SelectItem>
                {docentesDisponibles.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {modoVista === "CICLO" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center text-green-700 gap-1">
                <BookOpen className="h-4 w-4" /> Ciclo
              </label>
              <Select value={ciclo} onValueChange={setCiclo}>
                <SelectTrigger className={ciclo === "Todos" ? "border-green-300" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Seleccionar...</SelectItem>
                  {ciclosPermitidos.map((c) => (
                    <SelectItem key={c} value={c.toString()}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center text-green-700 gap-1">
                Grupo <span className="text-[10px] text-muted-foreground uppercase ml-2">Opcional</span>
              </label>
              <Select value={grupoFiltro} onValueChange={setGrupoFiltro} disabled={ciclo === "Todos"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {gruposDisponibles.map((g) => (
                    <SelectItem key={g} value={g}>Grupo {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {modoVista === "AULA" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-amber-700 flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Tipo de Ambiente
              </label>
              <Select value={tipoFiltro} onValueChange={(v) => { setTipoFiltro(v as any); setAulaFiltro("Todos"); setLaboratorioFiltro("Todos"); }}>
                <SelectTrigger className="border-amber-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AULA">Aula</SelectItem>
                  <SelectItem value="LABORATORIO">Laboratorio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {tipoFiltro === "AULA" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-700">Nombre del Aula</label>
                <Select value={aulaFiltro} onValueChange={setAulaFiltro}>
                  <SelectTrigger className="border-amber-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Seleccionar aula...</SelectItem>
                    {aulasDisponibles.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tipoFiltro === "LABORATORIO" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-700">Nombre del Laboratorio</label>
                <Select value={laboratorioFiltro} onValueChange={setLaboratorioFiltro}>
                  <SelectTrigger className="border-amber-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Seleccionar laboratorio...</SelectItem>
                    {laboratoriosDisponibles.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </div>

      {/* VISTA DE HORARIOS (CUADRÍCULA) */}
      {modoVista === "DOCENTE" && docenteFiltro === "Todos" ? (
        <div className="bg-white p-16 rounded-xl shadow-sm border text-center flex flex-col items-center justify-center">
          <User className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-xl font-medium text-slate-700">Selecciona un Docente</h3>
          <p className="text-slate-500 mt-2 max-w-md">Para visualizar el horario consolidado, debes indicar qué docente deseas consultar.</p>
        </div>
      ) : modoVista === "CICLO" && (!cicloEsValido || ciclo === "Todos") ? (
        <div className="bg-white p-16 rounded-xl shadow-sm border text-center flex flex-col items-center justify-center">
          <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-xl font-medium text-slate-700">Selecciona un Ciclo Válido</h3>
          <p className="text-slate-500 mt-2 max-w-md">Para visualizar el horario académico, debes indicar obligatoriamente de qué ciclo deseas ver las clases.</p>
        </div>
      ) : modoVista === "AULA" && (tipoFiltro === "Todos" || (tipoFiltro === "AULA" && aulaFiltro === "Todos") || (tipoFiltro === "LABORATORIO" && laboratorioFiltro === "Todos")) ? (
        <div className="bg-white p-16 rounded-xl shadow-sm border text-center flex flex-col items-center justify-center">
          <MapPin className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-xl font-medium text-slate-700">Selecciona un Ambiente</h3>
          <p className="text-slate-500 mt-2 max-w-md">Para ver la ocupabilidad, debes seleccionar un aula o laboratorio.</p>
        </div>
      ) : isLoading ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border text-center flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-500">Cargando horario...</p>
        </div>
      ) : asignacionesFiltradas.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border text-center flex flex-col items-center justify-center">
          <Calendar className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">⚠️ No se encontraron horarios con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto" ref={gridRef}>
          <div className="min-w-[800px] p-2 bg-white">
            {/* Cabecera de Días */}
            <div 
              className="grid border-b bg-slate-50/80 sticky top-0 z-10" 
              style={{ gridTemplateColumns: "75px repeat(6, 1fr)" }}
            >
              <div className="p-4 border-r font-semibold text-slate-500 text-center flex items-center justify-center text-xs">
                <Clock className="h-4 w-4 mr-1" /> Hora
              </div>
              {DIAS.map((dia) => (
                <div key={dia} className="p-4 border-r last:border-r-0 font-bold text-center text-slate-700">
                  {dia}
                </div>
              ))}
            </div>

            {/* Cuadrícula de Horas x Días */}
            <div className="relative">
              {HORAS.map((hora) => (
                // ↓ min-h ajustado a 90px para optimizar la proporción en PDF vertical
                <div 
                  key={hora} 
                  className={cn("grid border-b last:border-b-0", "min-h-[90px]")}
                  style={{ gridTemplateColumns: "75px repeat(6, 1fr)" }}
                >
                  {/* Columna de Hora */}
                  <div className="p-3 border-r bg-slate-50/30 text-sm font-semibold text-slate-500 flex items-start justify-center">
                    {hora}
                  </div>

                  {/* Celdas de Días */}
                  {DIAS.map((dia) => {
                    const asigs = getCellAsignaciones(dia, hora);
                    return (
                      <div key={`${dia}-${hora}`} className="border-r last:border-r-0 p-1 relative group bg-white hover:bg-slate-50 transition-colors">
                        {asigs.map((asig: any, idx: number) => {
                          const isStart = asig.horaInicio === hora;
                          const duracion = parseInt(asig.horaFin.split(":")[0]) - parseInt(asig.horaInicio.split(":")[0]);
                          const colorClass = COLORS[asig.grupo.curso.id.charCodeAt(0) % COLORS.length];

                          if (!isStart) return null;

                          return (
                            <div
                              key={asig.id}
                              onClick={() => setSelectedAsignacion(asig)}
                              className={cn(
                                "absolute top-1 left-1 right-1 rounded-md border shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md hover:z-20 z-10 flex flex-col overflow-hidden",
                                // ↓ padding uniforme p-1.5 para todas las duraciones, p-2 para 2h+
                                duracion === 1 ? "p-1.5" : "p-2",
                                colorClass
                              )}
                              style={{ 
                                height: `calc(${duracion * 100}% - 8px)`,
                                // ↓ minHeight ajustado
                                minHeight: "82px",
                                overflow: isExporting ? "visible" : "hidden",
                              }}
                            >
                              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                {/* Nombre del curso — letras más grandes (text-sm) */}
                                <div 
                                  className={cn(
                                    "font-bold leading-tight text-sm",
                                    duracion === 1 ? "mb-0.5" : "mb-1",
                                    !isExporting && duracion === 1 ? "line-clamp-3" : ""
                                  )} 
                                  style={{ wordBreak: 'break-word' }} 
                                  title={asig.grupo.curso.nombre}
                                >
                                  {asig.grupo.curso.nombre}
                                </div>
                                
                                {/* ETIQUETA EN MODO DOCENTE — fuente más grande */}
                                {isModoDocente && (
                                  <div className={cn(
                                    "bg-white/80 font-bold text-slate-800 inline-block border border-black/10 self-start text-[11px] px-1.5 py-0.5 rounded-sm",
                                    duracion === 1 ? "mb-0.5" : "mb-1"
                                  )}>
                                    {duracion === 1
                                      ? `C${asig.grupo.curso.ciclo}-G${asig.grupo.nombre}`
                                      : `Ciclo ${asig.grupo.curso.ciclo} - G${asig.grupo.nombre}`}
                                  </div>
                                )}
                              </div>
                              
                              {/* Sección inferior: aula y docente — fuente más grande */}
                              <div className="border-t border-black/10 shrink-0 pt-1 mt-auto">
                                <span className="flex items-center gap-1 text-[11px] opacity-90 font-medium leading-tight">
                                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className={isExporting ? "" : "truncate"}>
                                    {asig.ambiente.nombre}
                                    {!isModoDocente && ` · ${asig.docente?.usuario.nombre.split(" ")[0]} ${asig.docente?.usuario.nombre.split(" ")[1] ?? ""}`}
                                  </span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE */}
      <Dialog open={!!selectedAsignacion} onOpenChange={(open) => !open && setSelectedAsignacion(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Detalle de Clase
            </DialogTitle>
          </DialogHeader>
          
          {selectedAsignacion && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg text-slate-800 leading-tight">
                  {selectedAsignacion.grupo.curso.nombre}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-white">Ciclo {selectedAsignacion.grupo.curso.ciclo}</Badge>
                  <Badge variant="outline" className="bg-white">Grupo {selectedAsignacion.grupo.nombre}</Badge>
                  <Badge variant={selectedAsignacion.tipo === "AULA" ? "default" : "secondary"}>
                    {selectedAsignacion.tipo}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Docente</p>
                    <p className="font-medium text-slate-700">{selectedAsignacion.docente?.usuario.nombre}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Horario</p>
                    <p className="font-medium text-slate-700">
                      {selectedAsignacion.dia} • {selectedAsignacion.horaInicio} - {selectedAsignacion.horaFin}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Ambiente</p>
                    <p className="font-medium text-slate-700">{selectedAsignacion.ambiente.nombre}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Link href={`/dashboard/horarios/editar/${selectedAsignacion.grupoId}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Horario
                  </Button>
                </Link>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
