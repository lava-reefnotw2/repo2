const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const cursos = [
    // ─── I CICLO ───────────────────────────────────────────────────────────────
    { codigo: 'IS3311', nombre: 'Desarrollo del Pensamiento Lógico Matemático',       ciclo: 1, creditos: 3, horasTeoria: 1, horasLab: 4 },
    { codigo: 'IS3312', nombre: 'Lectura Crítica y Redacción de Textos Académicos',   ciclo: 1, creditos: 3, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS3313', nombre: 'Desarrollo Personal',                                ciclo: 1, creditos: 3, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS3314', nombre: 'Introducción al Análisis Matemático',                ciclo: 1, creditos: 4, horasTeoria: 2, horasLab: 4 },
    { codigo: 'IS3315', nombre: 'Estadística General',                                ciclo: 1, creditos: 4, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS3316', nombre: 'Introducción a la Ingeniería de Sistemas',           ciclo: 1, creditos: 2, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3317', nombre: 'Introducción a la Programación',                     ciclo: 1, creditos: 3, horasTeoria: 2, horasLab: 0 },

    // ─── II CICLO ──────────────────────────────────────────────────────────────
    { codigo: 'IS3321', nombre: 'Ética, Convivencia Humana y Ciudadanía',             ciclo: 2, creditos: 3, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS3322', nombre: 'Sociedad, Cultura y Ecología',                       ciclo: 2, creditos: 3, horasTeoria: 1, horasLab: 4 },
    { codigo: 'IS3323', nombre: 'Cultura Investigativa y Pensamiento Crítico',        ciclo: 2, creditos: 3, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS3324', nombre: 'Análisis Matemático',                                ciclo: 2, creditos: 4, horasTeoria: 2, horasLab: 4 },
    { codigo: 'IS3325', nombre: 'Física General',                                     ciclo: 2, creditos: 4, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS3326', nombre: 'Programación Orientada a Objetos I',                 ciclo: 2, creditos: 4, horasTeoria: 2, horasLab: 0 },

    // ─── III CICLO ─────────────────────────────────────────────────────────────
    { codigo: 'IS3331', nombre: 'Administración General',                             ciclo: 3, creditos: 3, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS3332', nombre: 'Sistémica',                                          ciclo: 3, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3333', nombre: 'Estadística Aplicada',                               ciclo: 3, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3334', nombre: 'Matemática Aplicada',                                ciclo: 3, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3335', nombre: 'Física Electrónica',                                 ciclo: 3, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3336', nombre: 'Programación Orientada a Objetos II',                ciclo: 3, creditos: 4, horasTeoria: 2, horasLab: 0 },

    // ─── IV CICLO ──────────────────────────────────────────────────────────────
    { codigo: 'IS3341', nombre: 'Economía General',                                   ciclo: 4, creditos: 3, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS3342', nombre: 'Diseño Web',                                         ciclo: 4, creditos: 3, horasTeoria: 1, horasLab: 1 },
    { codigo: 'IS3343', nombre: 'Pensamiento de Diseño',                              ciclo: 4, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3344', nombre: 'Gestión por Procesos',                               ciclo: 4, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3345', nombre: 'Sistemas Digitales',                                 ciclo: 4, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3346', nombre: 'Estructura de Datos Orientado a Objetos',            ciclo: 4, creditos: 4, horasTeoria: 2, horasLab: 1 },

    // ─── V CICLO ───────────────────────────────────────────────────────────────
    { codigo: 'IS3351', nombre: 'Contabilidad Gerencial',                             ciclo: 5, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3352', nombre: 'Tecnologías Web',                                    ciclo: 5, creditos: 3, horasTeoria: 1, horasLab: 1 },
    { codigo: 'IS3353', nombre: 'Investigación de Operaciones',                       ciclo: 5, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3354', nombre: 'Ingeniería de Datos I',                              ciclo: 5, creditos: 4, horasTeoria: 2, horasLab: 1 },
    { codigo: 'IS3355', nombre: 'Arquitectura y Organización de Computadoras',        ciclo: 5, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3356', nombre: 'Sistemas de Información',                            ciclo: 5, creditos: 4, horasTeoria: 2, horasLab: 2 },

    // ─── VI CICLO ──────────────────────────────────────────────────────────────
    { codigo: 'IS3361', nombre: 'Finanzas Corporativas',                              ciclo: 6, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3362', nombre: 'Sistemas Inteligentes',                              ciclo: 6, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3363', nombre: 'Ingeniería Económica',                               ciclo: 6, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3364', nombre: 'Ingeniería de Datos II',                             ciclo: 6, creditos: 4, horasTeoria: 2, horasLab: 1 },
    { codigo: 'IS3365', nombre: 'Sistemas Operativos',                                ciclo: 6, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3366', nombre: 'Ingeniería de Requerimientos',                       ciclo: 6, creditos: 3, horasTeoria: 1, horasLab: 2 },

    // ─── VII CICLO ─────────────────────────────────────────────────────────────
    { codigo: 'IS3371', nombre: 'Cadena de Suministro',                               ciclo: 7, creditos: 3, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS3372', nombre: 'Gestión de Servicios de TI',                         ciclo: 7, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3373', nombre: 'Metodología de la Investigación Científica',         ciclo: 7, creditos: 3, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS3374', nombre: 'Planeamiento Estratégico de la Información',         ciclo: 7, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3375', nombre: 'Redes y Comunicaciones I',                           ciclo: 7, creditos: 3, horasTeoria: 1, horasLab: 1 },
    { codigo: 'IS3376', nombre: 'Ingeniería del Software I',                          ciclo: 7, creditos: 4, horasTeoria: 2, horasLab: 1 },

    // ─── VIII CICLO ────────────────────────────────────────────────────────────
    { codigo: 'IS3381', nombre: 'Marketing y Medios Sociales',                        ciclo: 8, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3382', nombre: 'Seguridad de la Información',                        ciclo: 8, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3383', nombre: 'Internet de las Cosas',                              ciclo: 8, creditos: 3, horasTeoria: 1, horasLab: 1 },
    { codigo: 'IS3384', nombre: 'Inteligencia de Negocios',                           ciclo: 8, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3385', nombre: 'Redes y Comunicaciones II',                          ciclo: 8, creditos: 3, horasTeoria: 1, horasLab: 1 },
    { codigo: 'IS3386', nombre: 'Ingeniería del Software II',                         ciclo: 8, creditos: 4, horasTeoria: 2, horasLab: 1 },

    // ─── IX CICLO ──────────────────────────────────────────────────────────────
    { codigo: 'IS3391', nombre: 'Gestión de Proyectos de TI',                         ciclo: 9, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3392', nombre: 'Auditoría Informática',                              ciclo: 9, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3393', nombre: 'Tesis I',                                            ciclo: 9, creditos: 4, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS3394', nombre: 'Analítica de Negocios',                              ciclo: 9, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS3395', nombre: 'Computación en la Nube',                             ciclo: 9, creditos: 3, horasTeoria: 1, horasLab: 1 },
    { codigo: 'IS3396', nombre: 'Ingeniería Web',                                     ciclo: 9, creditos: 3, horasTeoria: 1, horasLab: 1 },

    // ─── X CICLO ───────────────────────────────────────────────────────────────
    { codigo: 'IS33X1', nombre: 'Sistemas de Información Empresarial',                ciclo: 10, creditos: 4, horasTeoria: 2, horasLab: 1 },
    { codigo: 'IS33X2', nombre: 'Gobierno de TI',                                     ciclo: 10, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS33X3', nombre: 'Tesis II',                                           ciclo: 10, creditos: 4, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS33X4', nombre: 'Arquitectura Empresarial',                           ciclo: 10, creditos: 3, horasTeoria: 1, horasLab: 2 },
    { codigo: 'IS33X5', nombre: 'Responsabilidad Social Corporativa',                 ciclo: 10, creditos: 3, horasTeoria: 2, horasLab: 2 },
    { codigo: 'IS33X6', nombre: 'Aplicaciones Móviles',                               ciclo: 10, creditos: 3, horasTeoria: 1, horasLab: 1 },
  ];

  console.log(`🌱 Seeding ${cursos.length} cursos (Ingeniería de Sistemas)...`);

  for (const curso of cursos) {
    const upsertedCurso = await prisma.curso.upsert({
      where: { codigo: curso.codigo },
      update: curso,
      create: curso,
    });

    // Crear grupos A y B si no existen
    for (const nombre of ['A', 'B']) {
      const grupoExists = await prisma.grupo.findFirst({
        where: { cursoId: upsertedCurso.id, nombre }
      });
      if (!grupoExists) {
        await prisma.grupo.create({
          data: { cursoId: upsertedCurso.id, nombre }
        });
      }
    }
  }

  console.log('✅ Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
