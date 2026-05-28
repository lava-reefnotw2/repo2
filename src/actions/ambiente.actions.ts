"use server";

import { revalidatePath } from "next/cache";
import { getAmbientes, createAmbiente, deleteAmbiente, updateAmbiente } from "@/services/ambiente.service";

export async function getAmbientesAction() {
  return await getAmbientes();
}

export async function createAmbienteAction(data: any) {
  await createAmbiente(data);
  revalidatePath("/dashboard/ambientes");
  return { success: true };
}

export async function deleteAmbienteAction(id: string) {
  await deleteAmbiente(id);
  revalidatePath("/dashboard/ambientes");
  return { success: true };
}

export async function updateAmbienteAction(id: string, data: any) {
  await updateAmbiente(id, data);
  revalidatePath("/dashboard/ambientes");
  return { success: true };
}
