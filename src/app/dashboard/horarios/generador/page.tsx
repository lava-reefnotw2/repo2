"use client";

import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/components/TRPCProvider";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GeneradorHorariosPage() {
  const [semestre, setSemestre] = useState("2026-II");
  const [escuela, setEscuela] = useState("Ingeniería de Sistemas");
  const [ciclo, setCiclo] = useState(7);
  const [periodoId, setPeriodoId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const findOrCreatePeriodo = trpc.periodo.findOrCreate.useMutation();
  const generarAutomatico = trpc.asignacion.generarAutomatico.useMutation();

  const ciclosDisponibles = useMemo(() => {
    if (semestre.endsWith("-I")) return [1, 3, 5, 7, 9];
    if (semestre.endsWith("-II")) return [2, 4, 6, 8, 10];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }, [semestre]);

  useEffect(() => {
    if (ciclosDisponibles.includes(ciclo)) return;
    const next = ciclosDisponibles[0] ?? 1;
    setCiclo(next);
    toast.message("ℹ️ El ciclo fue ajustado automáticamente según el semestre seleccionado.");
  }, [ciclo, ciclosDisponibles]);

  useEffect(() => {
    if (semestre && escuela && ciclo) {
      if (!ciclosDisponibles.includes(ciclo)) return;
      findOrCreatePeriodo.mutate(
        { semestre, escuela, ciclo },
        {
          onSuccess: (data) => {
            setPeriodoId(data.id);
          },
        }
      );
    }
  }, [semestre, escuela, ciclo]);

  const { data: asignaciones = [], refetch, isFetching } = trpc.asignacion.listByPeriodo.useQuery(
    { periodoId: periodoId! },
    { enabled: !!periodoId }
  );

  const handleGenerate = async () => {
    try {
      if (!ciclosDisponibles.includes(ciclo)) {
        toast.error("Ciclo inválido para el semestre seleccionado.");
        return;
      }
      await generarAutomatico.mutateAsync({ semestre, escuela, ciclo });
      toast.success(`Horarios generados para el ciclo ${ciclo}`);
      await refetch();
      setPreviewOpen(true);
    } catch (error: any) {
      toast.error(error.message || "Error al generar horarios");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 bg-white p-6 rounded-lg shadow">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Motor de Generación de Horarios</h2>
          <p className="text-gray-600 mt-2">
            El sistema asignará automáticamente docentes a cursos, evitando cruces de horarios y considerando la jerarquía, basándose en el ciclo seleccionado.
          </p>
        </div>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
          <div className="space-y-2">
            <Label>Semestre</Label>
            <Select value={semestre} onValueChange={setSemestre}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {["2026-II"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Escuela</Label>
            <Select value={escuela} onValueChange={setEscuela}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ingeniería de Sistemas">Ingeniería de Sistemas</SelectItem>
                <SelectItem value="Ingeniería Industrial">Ingeniería Industrial</SelectItem>
                <SelectItem value="Ingeniería Mecánica">Ingeniería Mecánica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ciclo</Label>
            <Select value={ciclo.toString()} onValueChange={(v) => setCiclo(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ciclosDisponibles.map((c) => (
                  <SelectItem key={c} value={c.toString()}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button 
            onClick={handleGenerate} 
            disabled={generarAutomatico.isPending || isFetching}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg h-auto"
          >
            {generarAutomatico.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Generar Horarios Automáticamente
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Resultados de Asignación (Ciclo {ciclo})</h3>
          <a href={periodoId ? `/api/reportes/horario-pdf?periodoId=${periodoId}` : "/api/reportes/horario-pdf"} target="_blank" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            Exportar PDF
          </a>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Día y Hora</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Curso / Grupo</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Docente</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Ambiente</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {asignaciones.map((asig: any) => (
              <tr key={asig.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {asig.dia} <br />
                  <span className="text-gray-500 font-normal">{asig.horaInicio} - {asig.horaFin}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-blue-900">{asig.grupo.curso.nombre}</div>
                  <div className="text-sm text-gray-500">Grupo {asig.grupo.nombre} ({asig.tipo})</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {asig.docente?.usuario?.nombre || "No asignado"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {asig.ambiente?.nombre || "No asignado"}
                </td>
              </tr>
            ))}
            {asignaciones.length === 0 && !isFetching && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 py-8">
                  No hay horarios generados. Presione el botón "Generar Horarios Automáticamente".
                </td>
              </tr>
            )}
            {isFetching && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Previsualización de Horarios Generados</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            {semestre} • {escuela} • Ciclo {ciclo} • {asignaciones.length} asignaciones
          </div>
          <div className="border rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Día y Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Curso / Grupo</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Docente</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Ambiente</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {asignaciones.map((asig: any) => (
                  <tr key={asig.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {asig.dia} <br />
                      <span className="text-gray-500 font-normal">{asig.horaInicio} - {asig.horaFin}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-900">{asig.grupo.curso.nombre}</div>
                      <div className="text-sm text-gray-500">Grupo {asig.grupo.nombre} ({asig.tipo})</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {asig.docente?.usuario?.nombre || "No asignado"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {asig.ambiente?.nombre || "No asignado"}
                    </td>
                  </tr>
                ))}
                {asignaciones.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No se generaron asignaciones.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cerrar</Button>
            <a href={periodoId ? `/api/reportes/horario-pdf?periodoId=${periodoId}` : "/api/reportes/horario-pdf"} target="_blank">
              <Button>Exportar PDF</Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
