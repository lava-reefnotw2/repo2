"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, Info, FileText } from "lucide-react";
import { getReporteGestionStatsAction } from "@/actions/dashboard.actions";

export default function ReporteGestionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const stats = await getReporteGestionStatsAction();
        setData(stats);
      } catch (error) {
        console.error("Error cargando reporte de gestión:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportPDF = async () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write('<html><body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh;"><h2>Generando PDF... por favor espere.</h2></body></html>');
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/reportes/gestion-pdf');
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  const { resumen, cargaDocente } = data;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reporte de Gestión y Cumplimiento</h2>
        <button 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          {isExporting ? 'Generando PDF...' : 'Descargar PDF'}
        </button>
      </div>

      {/* Resumen Ejecutivo */}
      <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Resumen Ejecutivo de Asignaciones</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Total Horarios Asignados</h4>
          <p className="text-2xl font-bold text-gray-800">{resumen.totalAsignaciones}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Completos (Aula + Docente)</h4>
          <p className="text-2xl font-bold text-green-600">{resumen.completas}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Pendientes de Docente</h4>
          <p className="text-2xl font-bold text-yellow-600">{resumen.sinDocente}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Falta Asignar Aula</h4>
          <p className="text-2xl font-bold text-red-600">{resumen.sinAula}</p>
        </div>
      </div>

      {/* Tabla de Carga Docente */}
      <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Cumplimiento de Carga Docente Semanal</h3>
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th scope="col" className="px-6 py-4">Docente</th>
                <th scope="col" className="px-6 py-4">Categoría</th>
                <th scope="col" className="px-6 py-4">Condición</th>
                <th scope="col" className="px-6 py-4 text-center">Horas Asignadas</th>
                <th scope="col" className="px-6 py-4">Estado de Carga</th>
              </tr>
            </thead>
            <tbody>
              {cargaDocente.map((docente: any, index: number) => (
                <tr key={docente.id} className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {docente.nombre}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {docente.categoria}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${docente.tipo === 'NOMBRADO' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {docente.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-gray-700">
                    {docente.horasAsignadas} hrs
                  </td>
                  <td className="px-6 py-4">
                    {docente.estado === 'NORMAL' && (
                      <span className="flex items-center text-green-600 gap-1.5 text-xs font-medium">
                        <CheckCircle2 size={16} /> Adecuada
                      </span>
                    )}
                    {docente.estado === 'SOBRECARGA' && (
                      <span className="flex items-center text-red-600 gap-1.5 text-xs font-medium">
                        <AlertCircle size={16} /> Excede límite
                      </span>
                    )}
                    {docente.estado === 'SIN_CARGA' && (
                      <span className="flex items-center text-gray-400 gap-1.5 text-xs font-medium">
                        <Info size={16} /> 0 Horas
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              
              {cargaDocente.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay docentes registrados en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
