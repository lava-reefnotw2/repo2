import { TipoAmbiente } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getAmbientes() {
  return await prisma.ambiente.findMany({
    orderBy: { nombre: "asc" },
  });
}

export async function createAmbiente(data: any) {
  return await prisma.ambiente.create({
    data: {
      nombre: data.nombre,
      pabellon: typeof data.pabellon === "string" && data.pabellon.trim().length > 0 ? data.pabellon.trim() : null,
      capacidad: parseInt(data.capacidad),
      tipo: data.tipo as TipoAmbiente,
    }
  });
}

export async function deleteAmbiente(id: string) {
  return await prisma.ambiente.delete({
    where: { id },
  });
}

export async function updateAmbiente(id: string, data: any) {
  return await prisma.ambiente.update({
    where: { id },
    data: {
      nombre: data.nombre,
      pabellon: typeof data.pabellon === "string" ? (data.pabellon.trim().length > 0 ? data.pabellon.trim() : null) : undefined,
      capacidad: parseInt(data.capacidad),
      tipo: data.tipo as TipoAmbiente,
    }
  });
}
