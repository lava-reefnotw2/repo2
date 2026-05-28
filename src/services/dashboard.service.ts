import { prisma } from "@/lib/prisma";

// Función auxiliar para calcular horas entre dos strings "HH:MM"
function calcularHoras(horaInicio: string, horaFin: string): number {
  try {
    const [h1, m1] = horaInicio.split(':').map(Number);
    const [h2, m2] = horaFin.split(':').map(Number);
    
    // Convertir todo a minutos para evitar problemas con decimales
    const min1 = h1 * 60 + (m1 || 0);
    const min2 = h2 * 60 + (m2 || 0);
    
    const diffMinutos = min2 - min1;
    return diffMinutos > 0 ? diffMinutos / 60 : 0;
  } catch (error) {
    console.error("Error al calcular horas:", error);
    return 0;
  }
}

export async function getDashboardStats() {
  const [
    totalDocentes,
    totalCursos,
    totalAulas,
    docentesPorCategoria,
    todasLasAsignaciones,
    ambientesDB
  ] = await Promise.all([
    prisma.docente.count(),
    prisma.curso.count(),
    prisma.ambiente.count({ where: { tipo: "AULA" } }),
    prisma.docente.groupBy({
      by: ["categoria"],
      _count: {
        categoria: true
      }
    }),
    prisma.asignacion.findMany({
      include: {
        ambiente: true,
        docente: {
          include: {
            usuario: true
          }
        }
      }
    }),
    prisma.ambiente.findMany()
  ]);

  // 1. Formatear datos para la distribución por categoría
  const dataDistribucion = docentesPorCategoria.map((item) => ({
    name: item.categoria.replace("_", " "),
    cantidad: item._count.categoria
  }));

  const categorias = ["PRINCIPAL", "ASOCIADO", "AUXILIAR", "JEFE_PRACTICA"];
  categorias.forEach(cat => {
    if (!dataDistribucion.find(d => d.name === cat.replace("_", " "))) {
      dataDistribucion.push({ name: cat.replace("_", " "), cantidad: 0 });
    }
  });

  // 2. Calcular Ocupación de Aulas (Top 10 más usadas)
  const ocupacionMap: Record<string, number> = {};
  ambientesDB.forEach(a => ocupacionMap[a.nombre] = 0);

  todasLasAsignaciones.forEach(asig => {
    if (asig.ambiente) {
      const horas = calcularHoras(asig.horaInicio, asig.horaFin);
      ocupacionMap[asig.ambiente.nombre] = (ocupacionMap[asig.ambiente.nombre] || 0) + horas;
    }
  });

  const dataOcupacionAulas = Object.entries(ocupacionMap)
    .map(([nombre, horas]) => ({ nombre, horas: Number(horas.toFixed(1)) }))
    .sort((a, b) => b.horas - a.horas)
    .slice(0, 10); // Top 10

  // 3. Calcular Carga Docente (Agrupación por rangos de horas semanales)
  const cargaDocentesMap: Record<string, number> = {};
  
  todasLasAsignaciones.forEach(asig => {
    if (asig.docenteId) {
      const horas = calcularHoras(asig.horaInicio, asig.horaFin);
      cargaDocentesMap[asig.docenteId] = (cargaDocentesMap[asig.docenteId] || 0) + horas;
    }
  });

  const rangosCarga = {
    "0-5 hrs": 0,
    "6-12 hrs": 0,
    "13-20 hrs": 0,
    "20+ hrs": 0,
  };

  Object.values(cargaDocentesMap).forEach(horas => {
    if (horas <= 5) rangosCarga["0-5 hrs"]++;
    else if (horas <= 12) rangosCarga["6-12 hrs"]++;
    else if (horas <= 20) rangosCarga["13-20 hrs"]++;
    else rangosCarga["20+ hrs"]++;
  });

  const dataCargaDocente = Object.entries(rangosCarga).map(([rango, cantidad]) => ({
    rango,
    cantidad
  }));

  return {
    totalDocentes,
    totalCursos,
    totalAulas,
    dataDistribucion,
    dataOcupacionAulas,
    dataCargaDocente
  };
}

export async function getReporteGestionStats() {
  const [
    totalAsignaciones,
    asignacionesSinDocente,
    asignacionesSinAula,
    docentes,
    asignaciones
  ] = await Promise.all([
    prisma.asignacion.count(),
    prisma.asignacion.count({ where: { docenteId: null } }),
    prisma.asignacion.count({ where: { ambienteId: null } }),
    prisma.docente.findMany({
      include: { usuario: true }
    }),
    prisma.asignacion.findMany({
      where: { docenteId: { not: null } }
    })
  ]);

  // Calcular carga semanal detallada por docente
  const cargaPorDocente = docentes.map(docente => {
    const asignacionesDocente = asignaciones.filter(a => a.docenteId === docente.id);
    let horasTotales = 0;
    
    asignacionesDocente.forEach(asig => {
      horasTotales += calcularHoras(asig.horaInicio, asig.horaFin);
    });

    // Validar cumplimiento (ejemplo de alerta)
    let estado = "NORMAL";
    if (horasTotales === 0) estado = "SIN_CARGA";
    else if (horasTotales > 36) estado = "SOBRECARGA";
    
    return {
      id: docente.id,
      nombre: docente.usuario.nombre,
      categoria: docente.categoria.replace("_", " "),
      tipo: docente.tipo,
      horasAsignadas: Number(horasTotales.toFixed(1)),
      estado
    };
  });

  // Ordenar por docentes con más horas primero
  cargaPorDocente.sort((a, b) => b.horasAsignadas - a.horasAsignadas);

  return {
    resumen: {
      totalAsignaciones,
      completas: totalAsignaciones - (asignacionesSinDocente + asignacionesSinAula),
      sinDocente: asignacionesSinDocente,
      sinAula: asignacionesSinAula
    },
    cargaDocente: cargaPorDocente
  };
}
