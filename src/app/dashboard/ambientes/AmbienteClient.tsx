"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createAmbienteAction, deleteAmbienteAction, updateAmbienteAction } from "@/actions/ambiente.actions";
import { Trash2, PlusSquare, Loader2, Edit2, Monitor } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ambienteSchema = z.object({
  nombre: z.string().min(3, "Nombre muy corto"),
  capacidad: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Capacidad inválida"),
  tipo: z.enum(["AULA", "LABORATORIO"]),
  pabellon: z.string().optional(),
});

type AmbienteFormValues = z.infer<typeof ambienteSchema>;

export default function AmbienteClient({ initialAmbientes }: { initialAmbientes: any[] }) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [editingAmbiente, setEditingAmbiente] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AmbienteFormValues>({
    resolver: zodResolver(ambienteSchema),
    defaultValues: {
      tipo: "AULA"
    }
  });

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: errorsEdit } } = useForm<AmbienteFormValues>({
    resolver: zodResolver(ambienteSchema),
  });

  const onSubmit = async (data: AmbienteFormValues) => {
    setLoading(true);
    try {
      await createAmbienteAction(data);
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = async (data: AmbienteFormValues) => {
    if (!editingAmbiente) return;
    setEditLoading(true);
    try {
      await updateAmbienteAction(editingAmbiente.id, data);
      setEditingAmbiente(null);
    } catch (error) {
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (ambiente: any) => {
    setEditingAmbiente(ambiente);
    resetEdit({
      nombre: ambiente.nombre,
      capacidad: ambiente.capacidad.toString(),
      tipo: ambiente.tipo,
      pabellon: ambiente.pabellon ?? ""
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este ambiente?")) return;
    setDeleteLoading(id);
    try {
      await deleteAmbienteAction(id);
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
          <PlusSquare className="mr-2 text-purple-600" size={20} /> Agregar Ambiente
        </h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Identificador</label>
            <input 
              type="text" 
              placeholder="Ej: Aula 101"
              {...register("nombre")} 
              className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 text-gray-700 focus:outline-none ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`} 
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad (Alumnos)</label>
            <input 
              type="number" 
              {...register("capacidad")} 
              className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 text-gray-700 focus:outline-none ${errors.capacidad ? 'border-red-500' : 'border-gray-300'}`} 
            />
            {errors.capacidad && <p className="text-red-500 text-xs mt-1">{errors.capacidad.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ambiente</label>
            <select 
              {...register("tipo")} 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 text-gray-700 focus:outline-none bg-white"
            >
              <option value="AULA">Aula de Teoría</option>
              <option value="LABORATORIO">Laboratorio de Cómputo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Aula</label>
            <input
              type="text"
              placeholder="Ej: Pabellón A, 2do piso"
              {...register("pabellon")}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 text-gray-700 focus:outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition flex justify-center items-center font-medium mt-6"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Guardar Ambiente"}
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacidad</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {initialAmbientes.map((amb) => (
                <tr key={amb.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {amb.nombre}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-[280px]">
                    <span className="line-clamp-2">{amb.pabellon || "-"}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {amb.capacidad} estudiantes
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-md ${amb.tipo === 'AULA' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                      {amb.tipo === 'LABORATORIO' && <Monitor size={12} className="mr-1" />}
                      {amb.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(amb)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(amb.id)}
                        disabled={deleteLoading === amb.id}
                        className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        {deleteLoading === amb.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialAmbientes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <PlusSquare className="text-gray-300 w-12 h-12 mb-3" />
                      <p>No hay ambientes registrados</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición */}
      <Dialog open={!!editingAmbiente} onOpenChange={(open) => !open && setEditingAmbiente(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit2 className="mr-2 text-purple-600" size={20} /> Editar Ambiente
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit(onEdit)} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Identificador</label>
              <input 
                type="text" 
                placeholder="Ej: Aula 101"
                {...registerEdit("nombre")} 
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 text-gray-700 focus:outline-none ${errorsEdit.nombre ? 'border-red-500' : 'border-gray-300'}`} 
              />
              {errorsEdit.nombre && <p className="text-red-500 text-xs mt-1">{errorsEdit.nombre.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad (Alumnos)</label>
              <input 
                type="number" 
                {...registerEdit("capacidad")} 
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 text-gray-700 focus:outline-none ${errorsEdit.capacidad ? 'border-red-500' : 'border-gray-300'}`} 
              />
              {errorsEdit.capacidad && <p className="text-red-500 text-xs mt-1">{errorsEdit.capacidad.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ambiente</label>
              <select 
                {...registerEdit("tipo")} 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 text-gray-700 focus:outline-none bg-white"
              >
                <option value="AULA">Aula de Teoría</option>
                <option value="LABORATORIO">Laboratorio de Cómputo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Aula</label>
              <input
                type="text"
                placeholder="Ej: Pabellón A, 2do piso"
                {...registerEdit("pabellon")}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 text-gray-700 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => setEditingAmbiente(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={editLoading}
                className="flex-1 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition flex justify-center items-center font-medium"
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
