const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function normalizeEmailPart(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.+/g, ".");
}

async function main() {
  await prisma.asignacion.deleteMany();
  await prisma.disponibilidad.deleteMany();
  await prisma.periodo.deleteMany();
  await prisma.grupo.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.ambiente.deleteMany();
  await prisma.docente.deleteMany();
  await prisma.usuario.deleteMany();

  const adminEmail = "admin@unt.edu.pe";
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);

  await prisma.usuario.create({
    data: {
      email: adminEmail,
      nombre: "Administrador del Sistema",
      password: hashedAdminPassword,
      rol: "ADMINISTRADOR",
    },
  });

  const escuelaSeed = "Ingeniería de Sistemas";

  const ambientesSeed = [
    { nombre: "Aula 101", pabellon: "Pabellón A, 1er piso", capacidad: 40, tipo: "AULA" },
    { nombre: "Aula 102", pabellon: "Pabellón A, 1er piso", capacidad: 35, tipo: "AULA" },
    { nombre: "Aula 201", pabellon: "Pabellón A, 2do piso", capacidad: 45, tipo: "AULA" },
    { nombre: "Laboratorio 1", pabellon: "Pabellón B, 1er piso", capacidad: 25, tipo: "LABORATORIO" },
    { nombre: "Laboratorio 2", pabellon: "Pabellón B, 1er piso", capacidad: 30, tipo: "LABORATORIO" },
  ];

  for (const a of ambientesSeed) {
    await prisma.ambiente.create({
      data: {
        nombre: a.nombre,
        pabellon: a.pabellon,
        capacidad: a.capacidad,
        tipo: a.tipo,
      },
    });
  }

  const cursosSeed = [
    { codigo: "SIS101", nombre: "Introducción a la Programación", ciclo: 1, creditos: 4, horasTeoria: 3, horasLab: 2 },
    { codigo: "SIS201", nombre: "Estructuras de Datos", ciclo: 2, creditos: 4, horasTeoria: 3, horasLab: 2 },
    { codigo: "SIS301", nombre: "Base de Datos", ciclo: 3, creditos: 4, horasTeoria: 3, horasLab: 2 },
    { codigo: "SIS401", nombre: "Sistemas Operativos", ciclo: 4, creditos: 4, horasTeoria: 3, horasLab: 2 },
    { codigo: "SIS501", nombre: "Ingeniería de Software I", ciclo: 5, creditos: 4, horasTeoria: 3, horasLab: 0 },
    { codigo: "SIS601", nombre: "Redes de Computadoras", ciclo: 6, creditos: 4, horasTeoria: 3, horasLab: 2 },
    { codigo: "SIS701", nombre: "Arquitectura de Software", ciclo: 7, creditos: 4, horasTeoria: 3, horasLab: 0 },
    { codigo: "SIS801", nombre: "Inteligencia Artificial", ciclo: 8, creditos: 4, horasTeoria: 3, horasLab: 2 },
    { codigo: "SIS901", nombre: "Gestión de Proyectos", ciclo: 9, creditos: 3, horasTeoria: 3, horasLab: 0 },
    { codigo: "SIS1001", nombre: "Seminario de Tesis", ciclo: 10, creditos: 4, horasTeoria: 2, horasLab: 2 },
  ];

  const cursosByCiclo = new Map();
  for (const c of cursosSeed) {
    const curso = await prisma.curso.create({ data: c });
    cursosByCiclo.set(c.ciclo, curso);
    await prisma.grupo.createMany({
      data: [
        { cursoId: curso.id, nombre: "A" },
        { cursoId: curso.id, nombre: "B" },
      ],
    });
  }

  const periodosSeed = [
    { semestre: "2026-I", ciclos: [1, 3, 5, 7, 9] },
    { semestre: "2026-II", ciclos: [2, 4, 6, 8, 10] },
  ];

  const periodosByKey = new Map();
  for (const p of periodosSeed) {
    for (const c of p.ciclos) {
      const periodo = await prisma.periodo.create({
        data: {
          semestre: p.semestre,
          escuela: escuelaSeed,
          ciclo: c,
        },
      });
      periodosByKey.set(`${p.semestre}|${c}`, periodo);
    }
  }

  const docentes = [
    { categoria: "PRINCIPAL", tipo: "NOMBRADO", fechaIngreso: new Date("2001-03-12T08:00:00.000Z") },
    { categoria: "PRINCIPAL", tipo: "NOMBRADO", fechaIngreso: new Date("1998-08-01T08:00:00.000Z") },
    { categoria: "PRINCIPAL", tipo: "CONTRATADO", fechaIngreso: new Date("2010-04-05T08:00:00.000Z") },
    { categoria: "PRINCIPAL", tipo: "CONTRATADO", fechaIngreso: new Date("2015-09-20T08:00:00.000Z") },
    { categoria: "ASOCIADO", tipo: "NOMBRADO", fechaIngreso: new Date("2003-02-17T08:00:00.000Z") },
    { categoria: "ASOCIADO", tipo: "NOMBRADO", fechaIngreso: new Date("2007-11-30T08:00:00.000Z") },
    { categoria: "ASOCIADO", tipo: "CONTRATADO", fechaIngreso: new Date("2012-06-10T08:00:00.000Z") },
    { categoria: "ASOCIADO", tipo: "CONTRATADO", fechaIngreso: new Date("2018-01-15T08:00:00.000Z") },
    { categoria: "AUXILIAR", tipo: "NOMBRADO", fechaIngreso: new Date("2005-07-22T08:00:00.000Z") },
    { categoria: "AUXILIAR", tipo: "NOMBRADO", fechaIngreso: new Date("2000-10-08T08:00:00.000Z") },
    { categoria: "AUXILIAR", tipo: "CONTRATADO", fechaIngreso: new Date("2014-03-25T08:00:00.000Z") },
    { categoria: "AUXILIAR", tipo: "CONTRATADO", fechaIngreso: new Date("2009-12-01T08:00:00.000Z") },
    { categoria: "JEFE_PRACTICA", tipo: "CONTRATADO", fechaIngreso: new Date("2016-08-14T08:00:00.000Z") },
    { categoria: "JEFE_PRACTICA", tipo: "CONTRATADO", fechaIngreso: new Date("2013-05-19T08:00:00.000Z") },
    { categoria: "JEFE_PRACTICA", tipo: "CONTRATADO", fechaIngreso: new Date("2017-02-28T08:00:00.000Z") },
    { categoria: "JEFE_PRACTICA", tipo: "NOMBRADO", fechaIngreso: new Date("2011-09-07T08:00:00.000Z") },
  ];

  const nombres = [
    { nombres: "Carlos Alberto", apellidos: "Mendoza Ríos" },
    { nombres: "Rosa María", apellidos: "Herrera Castillo" },
    { nombres: "Jorge Luis", apellidos: "Paredes Vega" },
    { nombres: "Ana Lucía", apellidos: "Sánchez Flores" },
    { nombres: "Marco Antonio", apellidos: "Torres Gutiérrez" },
    { nombres: "Patricia Elena", apellidos: "Vargas Morales" },
    { nombres: "Luis Enrique", apellidos: "Chávez Ramírez" },
    { nombres: "Sandra Beatriz", apellidos: "Díaz Ponce" },
    { nombres: "Roberto Carlos", apellidos: "Quispe Mamani" },
    { nombres: "Carmen Julia", apellidos: "Rojas Salinas" },
    { nombres: "Julio César", apellidos: "Núñez Cabrera" },
    { nombres: "María Isabel", apellidos: "Luna Espinoza" },
    { nombres: "Diego Alejandro", apellidos: "Aguilar Lozano" },
    { nombres: "Valeria Fernanda", apellidos: "Bustamante Cano" },
    { nombres: "Óscar Daniel", apellidos: "Pinedo Távara" },
    { nombres: "Claudia Milagros", apellidos: "Orrego Delgado" },
  ];

  const hashedDocentePassword = await bcrypt.hash("docente123", 10);
  const usedEmails = new Set();

  for (let i = 0; i < docentes.length; i++) {
    const docente = docentes[i];
    const nombre = nombres[i];
    const fullName = `${nombre.nombres} ${nombre.apellidos}`;
    const first = normalizeEmailPart(nombre.nombres.split(" ")[0] || `docente${i + 1}`);
    const last = normalizeEmailPart(nombre.apellidos.split(" ")[0] || `unt${i + 1}`);
    let email = `${first}.${last}@unt.edu.pe`;
    if (usedEmails.has(email)) email = `${first}.${last}.${i + 1}@unt.edu.pe`;
    usedEmails.add(email);

    await prisma.usuario.create({
      data: {
        email,
        nombre: fullName,
        password: hashedDocentePassword,
        rol: "DOCENTE",
        docente: {
          create: {
            categoria: docente.categoria,
            tipo: docente.tipo,
            fechaIngreso: docente.fechaIngreso,
          },
        },
      },
    });

    console.log(`✅ ${fullName} — ${docente.categoria} / ${docente.tipo} — ${email}`);
  }

  const docenteA = await prisma.docente.findFirst({ orderBy: { createdAt: "asc" } });
  const docenteB = await prisma.docente.findFirst({ orderBy: { createdAt: "desc" } });
  const aula = await prisma.ambiente.findFirst({ where: { tipo: "AULA" }, orderBy: { nombre: "asc" } });
  const lab = await prisma.ambiente.findFirst({ where: { tipo: "LABORATORIO" }, orderBy: { nombre: "asc" } });
  const periodoCiclo2 = periodosByKey.get("2026-II|2");
  const cursoCiclo2 = cursosByCiclo.get(2);

  if (docenteA && docenteB && aula && lab && periodoCiclo2 && cursoCiclo2) {
    const grupoA = await prisma.grupo.findFirst({ where: { cursoId: cursoCiclo2.id, nombre: "A" } });
    if (grupoA) {
      await prisma.asignacion.createMany({
        data: [
          {
            periodoId: periodoCiclo2.id,
            grupoId: grupoA.id,
            docenteId: docenteA.id,
            ambienteId: aula.id,
            dia: "LUNES",
            horaInicio: "07:00",
            horaFin: "09:00",
            tipo: "AULA",
          },
          {
            periodoId: periodoCiclo2.id,
            grupoId: grupoA.id,
            docenteId: docenteB.id,
            ambienteId: lab.id,
            dia: "MARTES",
            horaInicio: "09:00",
            horaFin: "11:00",
            tipo: "LABORATORIO",
          },
        ],
      });
    }
  }

  const [usuarios, docentesCount] = await Promise.all([
    prisma.usuario.count(),
    prisma.docente.count(),
  ]);

  console.log(`\n✨ Seed completado. Usuarios: ${usuarios}. Docentes: ${docentesCount}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
