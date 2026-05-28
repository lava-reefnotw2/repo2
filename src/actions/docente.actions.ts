"use server";

import { revalidatePath } from "next/cache";
import { getDocentes, createDocente, deleteDocente, updateDocente } from "@/services/docente.service";

export async function getDocentesAction() {
  return await getDocentes();
}

export async function createDocenteAction(data: { nombre: string, email: string, categoria: string, tipo: string, fechaIngreso: string }) {
  await createDocente(data);
  revalidatePath("/dashboard/docentes");
  return { success: true };
}

export async function deleteDocenteAction(id: string) {
  await deleteDocente(id);
  revalidatePath("/dashboard/docentes");
  return { success: true };
}

export async function updateDocenteAction(id: string, data: { nombre: string, email: string, categoria: string, tipo: string, fechaIngreso: string }) {
  await updateDocente(id, data);
  revalidatePath("/dashboard/docentes");
  return { success: true };
}
