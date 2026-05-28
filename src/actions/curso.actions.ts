"use server";

import { revalidatePath } from "next/cache";
import { getCursos, createCurso, deleteCurso, updateCurso } from "@/services/curso.service";

export async function getCursosAction() {
  return await getCursos();
}

export async function createCursoAction(data: any) {
  await createCurso(data);
  revalidatePath("/dashboard/cursos");
  return { success: true };
}

export async function deleteCursoAction(id: string) {
  await deleteCurso(id);
  revalidatePath("/dashboard/cursos");
  return { success: true };
}

export async function updateCursoAction(id: string, data: any) {
  await updateCurso(id, data);
  revalidatePath("/dashboard/cursos");
  return { success: true };
}
