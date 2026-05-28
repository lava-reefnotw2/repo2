"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createDocenteAction, deleteDocenteAction, updateDocenteAction } from "@/actions/docente.actions";
import { Trash2, UserPlus, Loader2, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const parseFechaDDMMYYYY = (value: string) => {
  const m = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
};

const formatFechaDDMMYYYY = (value: any) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = String(d.getUTCFullYear());
  return `${day}-${month}-${year}`;
};

const calcularAntiguedad = (fechaIngreso: any) => {
  const d = new Date(fechaIngreso);
  if (Number.isNaN(d.getTime())) return 0;
  const hoy = new Date();
  let age = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
};

const docenteSchema = z.object({
  nombre: z.string().min(3, "El nombre es muy corto"),
  email: z.string().email("Debe ser un correo válido"),
  categoria: z.enum(["PRINCIPAL", "ASOCIADO", "AUXILIAR", "JEFE_PRACTICA"]),
  tipo: z.enum(["NOMBRADO", "CONTRATADO"]),
  fechaIngreso: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Formato requerido DD-MM-AAAA")
    .refine((v) => Boolean(parseFechaDDMMYYYY(v)), "Fecha inválida"),
});

type DocenteFormValues = z.infer<typeof docenteSchema>;

export default function DocenteClient({ initialDocentes }: { initialDocentes: any[] }) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [editingDocente, setEditingDocente] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<"Todos" | "PRINCIPAL" | "ASOCIADO" | "AUXILIAR" | "JEFE_PRACTICA">("Todos");
  const [ordenAntiguedad, setOrdenAntiguedad] = useState<"DEFECTO" | "MAYOR" | "MENOR">("DEFECTO");
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DocenteFormValues>({
    resolver: zodResolver(docenteSchema),
    defaultValues: {
      categoria: "AUXILIAR",
      tipo: "CONTRATADO",
      fechaIngreso: "",
    }
  });

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: errorsEdit } } = useForm<DocenteFormValues>({
    resolver: zodResolver(docenteSchema),
  });

  const onSubmit = async (data: DocenteFormValues) => {
    setLoading(true);
    try {
      await createDocenteAction(data);
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = async (data: DocenteFormValues) => {
    if (!editingDocente) return;
    setEditLoading(true);
    try {
      await updateDocenteAction(editingDocente.usuario.id, data);
      setEditingDocente(null);
    } catch (error) {
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (docente: any) => {
    setEditingDocente(docente);
    resetEdit({
      nombre: docente.usuario.nombre,
      email: docente.usuario.email,
      categoria: docente.categoria,
      tipo: docente.tipo,
      fechaIngreso: formatFechaDDMMYYYY(docente.fechaIngreso),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este docente?")) return;
    setDeleteLoading(id);
    try {
      await deleteDocenteAction(id);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Formulario */}
      <div className="xl:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
          <UserPlus className="mr-2 text-blue-600" size={20} /> Agregar Docente
        </h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              {...register("nombre")} 
              className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`} 
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Universitario</label>
            <input 
              type="email" 
              {...register("email")} 
              className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'}`} 
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select 
              {...register("categoria")} 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none bg-white"
            >
              <option value="PRINCIPAL">Principal</option>
              <option value="ASOCIADO">Asociado</option>
              <option value="AUXILIAR">Auxiliar</option>
              <option value="JEFE_PRACTICA">Jefe de Práctica</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select 
              {...register("tipo")} 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none bg-white"
            >
              <option value="NOMBRADO">Nombrado</option>
              <option value="CONTRATADO">Contratado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio Servicio</label>
            <input
              type="text"
              placeholder="DD-MM-AAAA"
              inputMode="numeric"
              {...register("fechaIngreso")}
              className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errors.fechaIngreso ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.fechaIngreso && <p className="text-red-500 text-xs mt-1">{errors.fechaIngreso.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition flex justify-center items-center font-medium mt-6"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Guardar Docente"}
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-gray-700">Listado de docentes</div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Categoría</label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Todos">Todas</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="ASOCIADO">Asociado</option>
                <option value="AUXILIAR">Auxiliar</option>
                <option value="JEFE_PRACTICA">Jefe de Práctica</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Antigüedad</label>
              <select
                value={ordenAntiguedad}
                onChange={(e) => setOrdenAntiguedad(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="DEFECTO">Defecto</option>
                <option value="MAYOR">Mayor antigüedad</option>
                <option value="MENOR">Menor antigüedad</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Docente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Antigüedad</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {initialDocentes
                .filter((doc) => categoriaFiltro === "Todos" ? true : doc.categoria === categoriaFiltro)
                .slice()
                .sort((a, b) => {
                  if (ordenAntiguedad !== "DEFECTO") {
                    const antA = calcularAntiguedad(a.fechaIngreso);
                    const antB = calcularAntiguedad(b.fechaIngreso);
                    if (antA !== antB) {
                      return ordenAntiguedad === "MAYOR" ? antB - antA : antA - antB;
                    }
                  }
                  return String(a?.usuario?.nombre ?? "").localeCompare(String(b?.usuario?.nombre ?? ""));
                })
                .map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{doc.usuario.nombre}</div>
                    <div className="text-sm text-gray-500">{doc.usuario.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="px-2.5 py-1 w-max inline-flex text-xs leading-5 font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                        {doc.categoria.replace("_", " ")}
                      </span>
                      <span className="text-xs text-gray-500 font-medium ml-1">
                        {doc.tipo}
                      </span>
                      <span className="text-xs text-gray-500 font-medium ml-1">
                        Inicio: {formatFechaDDMMYYYY(doc.fechaIngreso)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="font-medium">{calcularAntiguedad(doc.fechaIngreso)}</span> años
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(doc)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.usuario.id)}
                        disabled={deleteLoading === doc.usuario.id}
                        className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        {deleteLoading === doc.usuario.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialDocentes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <UserPlus className="text-gray-300 w-12 h-12 mb-3" />
                      <p>No hay docentes registrados</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición */}
      <Dialog open={!!editingDocente} onOpenChange={(open) => !open && setEditingDocente(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit2 className="mr-2 text-blue-600" size={20} /> Editar Docente
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit(onEdit)} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input 
                type="text" 
                {...registerEdit("nombre")} 
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errorsEdit.nombre ? 'border-red-500' : 'border-gray-300'}`} 
              />
              {errorsEdit.nombre && <p className="text-red-500 text-xs mt-1">{errorsEdit.nombre.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Universitario</label>
              <input 
                type="email" 
                {...registerEdit("email")} 
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errorsEdit.email ? 'border-red-500' : 'border-gray-300'}`} 
              />
              {errorsEdit.email && <p className="text-red-500 text-xs mt-1">{errorsEdit.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select 
                {...registerEdit("categoria")} 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none bg-white"
              >
                <option value="PRINCIPAL">Principal</option>
                <option value="ASOCIADO">Asociado</option>
                <option value="AUXILIAR">Auxiliar</option>
                <option value="JEFE_PRACTICA">Jefe de Práctica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select 
                {...registerEdit("tipo")} 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none bg-white"
              >
                <option value="NOMBRADO">Nombrado</option>
                <option value="CONTRATADO">Contratado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio Servicio</label>
              <input
                type="text"
                placeholder="DD-MM-AAAA"
                inputMode="numeric"
                {...registerEdit("fechaIngreso")}
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errorsEdit.fechaIngreso ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errorsEdit.fechaIngreso && <p className="text-red-500 text-xs mt-1">{errorsEdit.fechaIngreso.message}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => setEditingDocente(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={editLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition flex justify-center items-center font-medium"
              >
                {editLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Actualizar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
