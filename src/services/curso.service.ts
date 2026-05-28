import { prisma } from "@/lib/prisma";

export async function getCursos() {
  return await prisma.curso.findMany({
    include: {
      grupos: true,
    },
    orderBy: { ciclo: "asc" },
  });
}

export async function createCurso(data: any) {
  const gruposArray = data.grupos.split(",").map((g: string) => g.trim()).filter(Boolean);

  return await prisma.curso.create({
    data: {
      codigo: data.codigo,
      nombre: data.nombre,
      ciclo: parseInt(data.ciclo),
      creditos: parseInt(data.creditos),
      horasTeoria: parseInt(data.horasTeoria),
      horasLab: parseInt(data.horasLab),
      grupos: {
        create: gruposArray.map((nombre: string) => ({ nombre }))
      }
    }
  });
}

export async function deleteCurso(id: string) {
  return await prisma.curso.delete({
    where: { id },
  });
}

export async function updateCurso(id: string, data: any) {
  const gruposArray = data.grupos.split(",").map((g: string) => g.trim()).filter(Boolean);

  // Primero eliminamos los grupos existentes para reemplazarlos
  await prisma.grupo.deleteMany({
    where: { cursoId: id }
  });

  return await prisma.curso.update({
    where: { id },
    data: {
      codigo: data.codigo,
      nombre: data.nombre,
      ciclo: parseInt(data.ciclo),
      creditos: parseInt(data.creditos),
      horasTeoria: parseInt(data.horasTeoria),
      horasLab: parseInt(data.horasLab),
      grupos: {
        create: gruposArray.map((nombre: string) => ({ nombre }))
      }
    }
  });
}
