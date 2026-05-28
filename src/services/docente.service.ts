import { CategoriaDocente, TipoDocente } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function parseFechaDDMMYYYYToUtcDate(value: string) {
  const m = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) throw new Error("Formato inválido de fecha. Use DD-MM-AAAA.");
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) throw new Error("Fecha inválida.");
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("Fecha inválida.");
  }
  return date;
}

export async function getDocentes() {
  return await prisma.docente.findMany({
    include: {
      usuario: true,
    },
    orderBy: [{ fechaIngreso: "asc" }, { usuario: { nombre: "asc" } }],
  });
}

export async function createDocente(data: { nombre: string, email: string, categoria: string, tipo: string, fechaIngreso: string }) {
  const hashedPassword = await bcrypt.hash("docente123", 10);
  
  return await prisma.usuario.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      password: hashedPassword,
      rol: "DOCENTE",
      docente: {
        create: {
          categoria: data.categoria as CategoriaDocente,
          tipo: data.tipo as TipoDocente,
          fechaIngreso: parseFechaDDMMYYYYToUtcDate(data.fechaIngreso),
        }
      }
    }
  });
}

export async function deleteDocente(id: string) {
  return await prisma.usuario.delete({
    where: { id },
  });
}

export async function updateDocente(id: string, data: { nombre: string, email: string, categoria: string, tipo: string, fechaIngreso: string }) {
  return await prisma.usuario.update({
    where: { id },
    data: {
      nombre: data.nombre,
      email: data.email,
      docente: {
        update: {
          categoria: data.categoria as CategoriaDocente,
          tipo: data.tipo as TipoDocente,
          fechaIngreso: parseFechaDDMMYYYYToUtcDate(data.fechaIngreso),
        }
      }
    }
  });
}
