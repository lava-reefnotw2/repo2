"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createCursoAction, deleteCursoAction, updateCursoAction } from "@/actions/curso.actions";
import { Trash2, BookPlus, Loader2, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const cursoSchema = z.object({
  codigo: z.string().min(3, "Código obligatorio"),
  nombre: z.string().min(3, "Nombre muy corto"),
  ciclo: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 10, "Ciclo válido del 1 al 10"),
  creditos: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Créditos requeridos"),
  horasTeoria: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Valor inválido"),
  horasLab: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Valor inválido"),
  grupos: z.string().min(1, "Especifique al menos un grupo"),
});

type CursoFormValues = z.infer<typeof cursoSchema>;

export default function CursoClient({ initialCursos }: { initialCursos: any[] }) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [editingCurso, setEditingCurso] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CursoFormValues>({
    resolver: zodResolver(cursoSchema),
  });

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: errorsEdit } } = useForm<CursoFormValues>({
    resolver: zodResolver(cursoSchema),
  });

  const onSubmit = async (data: CursoFormValues) => {
    setLoading(true);
    try {
      await createCursoAction(data);
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = async (data: CursoFormValues) => {
    if (!editingCurso) return;
    setEditLoading(true);
    try {
      await updateCursoAction(editingCurso.id, data);
      setEditingCurso(null);
    } catch (error) {
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (curso: any) => {
    setEditingCurso(curso);
    resetEdit({
      codigo: curso.codigo,
      nombre: curso.nombre,
      ciclo: curso.ciclo.toString(),
      creditos: curso.creditos.toString(),
      horasTeoria: curso.horasTeoria.toString(),
      horasLab: curso.horasLab.toString(),
      grupos: curso.grupos.map((g: any) => g.nombre).join(", ")
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este curso?")) return;
    setDeleteLoading(id);
    try {
      await deleteCursoAction(id);
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
          <BookPlus className="mr-2 text-green-600" size={20} /> Agregar Curso
        </h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Curso</label>
              <input 
                type="text" 
                {...register("nombre")} 
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 text-gray-700 focus:outline-none ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`} 
              />
              {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input 
                type="text" 
                {...register("codigo")} 
                placeholder="Ej: CS101"
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 text-gray-700 focus:outline-none ${errors.codigo ? 'border-red-500' : 'border-gray-300'}`} 
              />
              {errors.codigo && <p className="text-red-500 text-xs mt-1">{errors.codigo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo</label>
              <input 
                type="number" 
                {...register("ciclo")} 
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 text-gray-700 focus:outline-none ${errors.ciclo ? 'border-red-500' : 'border-gray-300'}`} 
              />
              {errors.ciclo && <p className="text-red-500 text-xs mt-1">{errors.ciclo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Créditos</label>
              <input 
                type="number" 
                {...register("creditos")} 
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 text-gray-700 focus:outline-none ${errors.creditos ? 'border-red-500' : 'border-gray-300'}`} 
              />
              {errors.creditos && <p className="text-red-500 text-xs mt-1">{errors.creditos.message}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Horas (Teoría / Laboratorio)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="T"
                  {...register("horasTeoria")} 
                  className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 text-gray-700 focus:outline-none ${errors.horasTeoria ? 'border-red-500' : 'border-gray-300'}`} 
                />
                <input 
                  type="number" 
                  placeholder="L"
                  {...register("horasLab")} 
                  className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 text-gray-700 focus:outline-none ${errors.horasLab ? 'border-red-500' : 'border-gray-300'}`} 
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupos (separados por coma)</label>
              <input 
                type="text" 
                placeholder="A, B, C"
                {...register("grupos")} 
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 text-gray-700 focus:outline-none ${errors.grupos ? 'border-red-500' : 'border-gray-300'}`} 
              />
              {errors.grupos && <p className="text-red-500 text-xs mt-1">{errors.grupos.message}</p>}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition flex justify-center items-center font-medium mt-6"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Guardar Curso"}
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Curso</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalles</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {initialCursos.map((curso) => (
                <tr key={curso.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {curso.codigo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{curso.nombre}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Grupos: {curso.grupos.map((g: any) => g.nombre).join(", ") || "Ninguno"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col text-xs text-gray-600 gap-1">
                      <span>Ciclo: {curso.ciclo} | Créditos: {curso.creditos}</span>
                      <span>Teoría: {curso.horasTeoria}h | Lab: {curso.horasLab}h</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(curso)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(curso.id)}
                        disabled={deleteLoading === curso.id}
                        className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        {deleteLoading === curso.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialCursos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <BookPlus className="text-gray-300 w-12 h-12 mb-3" />
                      <p>No hay cursos registrados</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición */}
      <Dialog open={!!editingCurso} onOpenChange={(open) => !open && setEditingCurso(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit2 className="mr-2 text-blue-600" size={20} /> Editar Curso
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit(onEdit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Curso</label>
                <input 
                  type="text" 
                  {...registerEdit("nombre")} 
                  className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errorsEdit.nombre ? 'border-red-500' : 'border-gray-300'}`} 
                />
                {errorsEdit.nombre && <p className="text-red-500 text-xs mt-1">{errorsEdit.nombre.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input 
                  type="text" 
                  {...registerEdit("codigo")} 
                  className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errorsEdit.codigo ? 'border-red-500' : 'border-gray-300'}`} 
                />
                {errorsEdit.codigo && <p className="text-red-500 text-xs mt-1">{errorsEdit.codigo.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciclo</label>
                <input 
                  type="number" 
                  {...registerEdit("ciclo")} 
                  className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errorsEdit.ciclo ? 'border-red-500' : 'border-gray-300'}`} 
                />
                {errorsEdit.ciclo && <p className="text-red-500 text-xs mt-1">{errorsEdit.ciclo.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Créditos</label>
                <input 
                  type="number" 
                  {...registerEdit("creditos")} 
                  className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errorsEdit.creditos ? 'border-red-500' : 'border-gray-300'}`} 
                />
                {errorsEdit.creditos && <p className="text-red-500 text-xs mt-1">{errorsEdit.creditos.message}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas (Teoría / Laboratorio)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="T"
                    {...registerEdit("horasTeoria")} 
                    className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errorsEdit.horasTeoria ? 'border-red-500' : 'border-gray-300'}`} 
                  />
                  <input 
                    type="number" 
                    placeholder="L"
                    {...registerEdit("horasLab")} 
                    className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errorsEdit.horasLab ? 'border-red-500' : 'border-gray-300'}`} 
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupos (separados por coma)</label>
                <input 
                  type="text" 
                  placeholder="A, B, C"
                  {...registerEdit("grupos")} 
                  className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 text-gray-700 focus:outline-none ${errorsEdit.grupos ? 'border-red-500' : 'border-gray-300'}`} 
                />
                {errorsEdit.grupos && <p className="text-red-500 text-xs mt-1">{errorsEdit.grupos.message}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => setEditingCurso(null)}
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
