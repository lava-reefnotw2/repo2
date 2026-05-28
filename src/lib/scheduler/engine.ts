import { DiaSemana, TipoAmbiente } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Generar bloques disponibles de clases dependiendo de su duración
function generarBloques(horas: number) {
  const bloques = [];
  // Mañana: 07:00 a 13:00
  for (let h = 7; h <= 13 - horas; h++) {
    bloques.push({ 
      inicio: `${h.toString().padStart(2, '0')}:00`, 
      fin: `${(h + horas).toString().padStart(2, '0')}:00` 
    });
  }
  // Tarde: 14:00 a 20:00
  for (let h = 14; h <= 20 - horas; h++) {
    bloques.push({ 
      inicio: `${h.toString().padStart(2, '0')}:00`, 
      fin: `${(h + horas).toString().padStart(2, '0')}:00` 
    });
  }
  // Aleatorizar los bloques para que las clases se distribuyan orgánicamente en todo el día (mañana/tarde)
  return bloques.sort(() => Math.random() - 0.5);
}

const DIAS = Object.values(DiaSemana);

export async function generarHorariosAutomagicamente(semestre: string, escuela: string, ciclo: number) {
  // 0. Obtener o crear un periodo por defecto para la generación automática
  const periodoDefault = await prisma.periodo.upsert({
    where: { semestre_escuela_ciclo: { semestre, escuela, ciclo } },
    update: {},
    create: { semestre, escuela, ciclo },
  });

  // 1. Limpiar asignaciones anteriores del periodo actual
  await prisma.asignacion.deleteMany({
    where: { periodoId: periodoDefault.id }
  });

  // 2. Extraer TODAS las asignaciones previas del mismo SEMESTRE (para validación cruzada global)
  const asignacionesPreviasDB = await prisma.asignacion.findMany({
    where: { 
      periodo: { semestre: semestre },
      periodoId: { not: periodoDefault.id } // Excluir las que acabamos de borrar
    },
    include: { grupo: { include: { curso: true } } }
  });

  // Mapear al mismo formato que las temporales
  const asignacionesGlobales = asignacionesPreviasDB.map(a => ({
    ...a,
    prefijoCarrera: a.grupo.curso.codigo.substring(0, 2).toUpperCase(),
    ciclo: a.grupo.curso.ciclo,
    grupoNombre: a.grupo.nombre
  }));

  // Mapear nombre de escuela a prefijo
  const prefijoMap: Record<string, string> = {
    "Ingeniería de Sistemas": "IS",
    "Ingeniería Mecánica": "IM",
    "Ingeniería Industrial": "II"
  };
  const prefijoEscuela = prefijoMap[escuela] || "IS";

  // 3. Obtener datos necesarios
  const gruposDB = await prisma.grupo.findMany({
    where: { 
      curso: { 
        ciclo: ciclo,
        codigo: { startsWith: prefijoEscuela }
      } 
    },
    include: { curso: true }
  });

  const docentes = await prisma.docente.findMany({
    include: { usuario: true, disponibilidad: true }
  });

  const aulas = await prisma.ambiente.findMany({ where: { tipo: "AULA" } });
  const laboratorios = await prisma.ambiente.findMany({ where: { tipo: "LABORATORIO" } });

  // 4. Estructuras de carga y validación
  let logs: string[] = [];
  const asignacionesTemp: any[] = [];
  
  // Carga total del docente para ordenamiento
  const cargaDocente: Record<string, number> = {};
  // Carga diaria estricta del docente (Límite: 8h/día)
  const cargaDocentePorDia: Record<string, number> = {};
  
  const cargaCohortePorDia: Record<string, number> = {};
  
  for (const d of docentes) {
    cargaDocente[d.id] = 0;
  }

  // Llenar cargas de los docentes usando las asignaciones GLOBALES existentes
  for (const a of asignacionesGlobales) {
    if (a.docenteId) {
      const horas = parseInt(a.horaFin.split(':')[0]) - parseInt(a.horaInicio.split(':')[0]);
      cargaDocente[a.docenteId] += horas;
      const key = `${a.docenteId}_${a.dia}`;
      cargaDocentePorDia[key] = (cargaDocentePorDia[key] || 0) + horas;
    }
  }

  // Agrupar los cursos por prefijo de escuela (primeros 2 caracteres)
  const gruposPorCarrera: Record<string, any[]> = {};
  const cargaPorCarrera: Record<string, number> = {};

  for (const g of gruposDB) {
    const prefijo = g.curso.codigo.substring(0, 2).toUpperCase();
    if (!gruposPorCarrera[prefijo]) {
      gruposPorCarrera[prefijo] = [];
      cargaPorCarrera[prefijo] = 0;
    }
    gruposPorCarrera[prefijo].push(g);
    cargaPorCarrera[prefijo] += (g.curso.horasTeoria + g.curso.horasLab);
  }

  const carrerasOrdenadas = Object.keys(gruposPorCarrera).sort((a, b) => cargaPorCarrera[b] - cargaPorCarrera[a]);

  const jerarquiaCategoria: Record<string, number> = {
    PRINCIPAL: 1, ASOCIADO: 2, AUXILIAR: 3, JEFE_PRACTICA: 4,
  };

  function getDocentesOrdenados() {
    return [...docentes].sort((a, b) => {
      // Priorizar la distribución igualitaria de horas primero
      if (cargaDocente[a.id] !== cargaDocente[b.id]) {
        return cargaDocente[a.id] - cargaDocente[b.id];
      }
      // Desempatar por jerarquía
      return jerarquiaCategoria[a.categoria] - jerarquiaCategoria[b.categoria];
    });
  }

  function getCargaCohorte(prefijo: string, cicloVal: number, grupoNombre: string, dia: DiaSemana) {
    return cargaCohortePorDia[`${prefijo}_${cicloVal}_${grupoNombre}_${dia}`] || 0;
  }

  function addCargaCohorte(prefijo: string, cicloVal: number, grupoNombre: string, dia: DiaSemana, horas: number) {
    const key = `${prefijo}_${cicloVal}_${grupoNombre}_${dia}`;
    cargaCohortePorDia[key] = (cargaCohortePorDia[key] || 0) + horas;
  }

  function getDiasOrdenados(prefijo: string, cicloVal: number, grupoNombre: string) {
    return [...DIAS].sort((diaA, diaB) => {
      return getCargaCohorte(prefijo, cicloVal, grupoNombre, diaA) - getCargaCohorte(prefijo, cicloVal, grupoNombre, diaB);
    });
  }

  function checkTimeOverlap(a: any, inicio: string, fin: string) {
    return (a.horaInicio < fin && a.horaFin > inicio);
  }

  // Verifica si el bloque de clase propuesto entra completamente dentro de los rangos de disponibilidad declarados
  function isDentroDeDisponibilidad(bloqueInicio: string, bloqueFin: string, disponibilidades: any[]) {
    // Si no hay registros de disponibilidad, el docente está 100% libre según requerimiento.
    if (!disponibilidades || disponibilidades.length === 0) return true;

    return disponibilidades.some(disp => 
      bloqueInicio >= disp.horaInicio && bloqueFin <= disp.horaFin
    );
  }

  function isDisponible(docente: any, ambienteId: string, prefijo: string, cicloVal: number, grupoNombre: string, cursoId: string, dia: DiaSemana, inicio: string, fin: string, horasDuracion: number): boolean {
    const docenteId = docente.id;
    
    // 0. Límite máximo semanal de 36 horas totales
    const cargaActualSemanal = cargaDocente[docenteId] || 0;
    if (cargaActualSemanal + horasDuracion > 36) return false;

    // 1. Limite Estricto de 8 horas diarias por Docente
    const cargaActualDia = cargaDocentePorDia[`${docenteId}_${dia}`] || 0;
    if (cargaActualDia + horasDuracion > 8) return false;

    // 2. Validación de Disponibilidad Real (Tabla Disponibilidad)
    const dispDelDocente = docente.disponibilidad || [];
    if (dispDelDocente.length > 0) {
      const dispDelDia = dispDelDocente.filter((d: any) => d.dia === dia);
      if (dispDelDia.length === 0) return false; // Declaró disponibilidades, pero no en este día
      if (!isDentroDeDisponibilidad(inicio, fin, dispDelDia)) return false; // El bloque choca con sus horas declaradas
    }

    // 3. Validación Cruzada con Historial Global + Temporal
    const todasLasAsignaciones = [...asignacionesGlobales, ...asignacionesTemp];

    const isOccupied = todasLasAsignaciones.some((a: any) => 
      a.dia === dia && checkTimeOverlap(a, inicio, fin) &&
      (
        a.docenteId === docenteId || 
        a.ambienteId === ambienteId || 
        // VALIDACIÓN ESTRICTA MULTI-CARRERA: Mismo Prefijo + Mismo Ciclo + Mismo Grupo
        (a.prefijoCarrera === prefijo && a.ciclo === cicloVal && a.grupoNombre === grupoNombre) 
      )
    );

    if (isOccupied) return false;

    // 4. Evitar que el docente dicte el mismo curso a distintos grupos en el mismo día (diversidad)
    const haDictadoMismoCursoEseDia = todasLasAsignaciones.some((a: any) => 
      a.dia === dia && 
      a.docenteId === docenteId && 
      a.cursoId === cursoId &&
      a.grupoNombre !== grupoNombre
    );

    if (haDictadoMismoCursoEseDia) return false;

    return true;
  }

  // 5. Bucle principal de asignación
  for (const prefijoCarrera of carrerasOrdenadas) {
    logs.push(`--- PROCESANDO CARRERA: [${prefijoCarrera}] ---`);
    
    const gruposDeCarrera = gruposPorCarrera[prefijoCarrera].sort((a, b) => {
      const totalA = a.curso.horasTeoria + a.curso.horasLab;
      const totalB = b.curso.horasTeoria + b.curso.horasLab;
      return totalB - totalA;
    });

    for (const grupo of gruposDeCarrera) {
      const curso = grupo.curso;
      const necesitaTeoria = curso.horasTeoria > 0;
      const necesitaLab = curso.horasLab > 0;

      let cursoAsignadoCompleto = false;
      const docentesOrdenados = getDocentesOrdenados();

      // Envolvemos TODO el curso en la iteración del docente (1 DOCENTE POR CURSO)
      for (const docente of docentesOrdenados) {
        if (cursoAsignadoCompleto) break;

        let teoriaAsignacion: any = null;
        let labAsignacion: any = null;
        let teoricaFallida = false;
        let labFallida = false;

        // 1. Intentar asignar Teoría
        if (necesitaTeoria) {
          let teoriaEncontrada = false;
          const diasInteligentes = getDiasOrdenados(prefijoCarrera, curso.ciclo, grupo.nombre);
          
          for (const dia of diasInteligentes) {
            if (teoriaEncontrada) break;
            const bloquesTeoria = generarBloques(curso.horasTeoria);
            
            for (const bloque of bloquesTeoria) {
              if (teoriaEncontrada) break;
              const aulaLibre = aulas.find((aula) => isDisponible(docente, aula.id, prefijoCarrera, curso.ciclo, grupo.nombre, curso.id, dia, bloque.inicio, bloque.fin, curso.horasTeoria));
              
              if (aulaLibre) {
                teoriaAsignacion = {
                  grupoId: grupo.id, cursoId: curso.id, docenteId: docente.id, ambienteId: aulaLibre.id,
                  periodoId: periodoDefault.id, dia, horaInicio: bloque.inicio, horaFin: bloque.fin,
                  tipo: "AULA" as TipoAmbiente, prefijoCarrera, ciclo: curso.ciclo, grupoNombre: grupo.nombre,
                };
                teoriaEncontrada = true;
              }
            }
          }
          if (!teoriaEncontrada) teoricaFallida = true;
        }

        // Si falló teoría, no tiene sentido probar lab para este docente. Saltamos al siguiente.
        if (teoricaFallida) continue;

        // 2. Intentar asignar Laboratorio
        if (necesitaLab) {
          // Para que isDisponible analice también la Teoría recién asignada y evite cruces consigo misma,
          // la pusheamos temporalmente a las asignaciones.
          if (teoriaAsignacion) {
             asignacionesTemp.push(teoriaAsignacion);
             cargaDocente[docente.id] += curso.horasTeoria;
             cargaDocentePorDia[`${docente.id}_${teoriaAsignacion.dia}`] = (cargaDocentePorDia[`${docente.id}_${teoriaAsignacion.dia}`] || 0) + curso.horasTeoria;
             addCargaCohorte(prefijoCarrera, curso.ciclo, grupo.nombre, teoriaAsignacion.dia, curso.horasTeoria);
          }

          let labEncontrado = false;
          const diasInteligentes = getDiasOrdenados(prefijoCarrera, curso.ciclo, grupo.nombre);
          
          for (const dia of diasInteligentes) {
            if (labEncontrado) break;
            const bloquesLab = generarBloques(curso.horasLab);
            
            for (const bloque of bloquesLab) {
              if (labEncontrado) break;
              const labLibre = laboratorios.find((lab) => isDisponible(docente, lab.id, prefijoCarrera, curso.ciclo, grupo.nombre, curso.id, dia, bloque.inicio, bloque.fin, curso.horasLab));
              
              if (labLibre) {
                labAsignacion = {
                  grupoId: grupo.id, cursoId: curso.id, docenteId: docente.id, ambienteId: labLibre.id,
                  periodoId: periodoDefault.id, dia, horaInicio: bloque.inicio, horaFin: bloque.fin,
                  tipo: "LABORATORIO" as TipoAmbiente, prefijoCarrera, ciclo: curso.ciclo, grupoNombre: grupo.nombre,
                };
                labEncontrado = true;
              }
            }
          }
          if (!labEncontrado) labFallida = true;
        }

        // 3. Rollback en caso de fallo parcial
        if (labFallida) {
          if (teoriaAsignacion) {
             // Revertir la asignación temporal de la teoría porque el docente no pudo con el paquete completo
             asignacionesTemp.pop();
             cargaDocente[docente.id] -= curso.horasTeoria;
             cargaDocentePorDia[`${docente.id}_${teoriaAsignacion.dia}`] -= curso.horasTeoria;
             addCargaCohorte(prefijoCarrera, curso.ciclo, grupo.nombre, teoriaAsignacion.dia, -curso.horasTeoria);
          }
          continue; // El docente falló, probamos con el siguiente en la lista.
        }

        // 4. Confirmación Definitiva (El docente superó todo!)
        if (teoriaAsignacion && !necesitaLab) {
            // Si solo necesitaba teoría, la pusheamos porque no entró al bloque de `necesitaLab` donde se hace temporalmente
            asignacionesTemp.push(teoriaAsignacion);
            cargaDocente[docente.id] += curso.horasTeoria;
            cargaDocentePorDia[`${docente.id}_${teoriaAsignacion.dia}`] = (cargaDocentePorDia[`${docente.id}_${teoriaAsignacion.dia}`] || 0) + curso.horasTeoria;
            addCargaCohorte(prefijoCarrera, curso.ciclo, grupo.nombre, teoriaAsignacion.dia, curso.horasTeoria);
        }

        if (labAsignacion) {
            asignacionesTemp.push(labAsignacion);
            cargaDocente[docente.id] += curso.horasLab;
            cargaDocentePorDia[`${docente.id}_${labAsignacion.dia}`] = (cargaDocentePorDia[`${docente.id}_${labAsignacion.dia}`] || 0) + curso.horasLab;
            addCargaCohorte(prefijoCarrera, curso.ciclo, grupo.nombre, labAsignacion.dia, curso.horasLab);
        }

        cursoAsignadoCompleto = true;
        if (teoriaAsignacion) logs.push(`Teoría asignada: ${curso.nombre} (Grupo ${grupo.nombre}) -> Docente: ${docente.usuario.nombre} | ${teoriaAsignacion.dia} ${teoriaAsignacion.horaInicio}-${teoriaAsignacion.horaFin}`);
        if (labAsignacion) logs.push(`Laboratorio asignado: ${curso.nombre} (Grupo ${grupo.nombre}) -> Docente: ${docente.usuario.nombre} | ${labAsignacion.dia} ${labAsignacion.horaInicio}-${labAsignacion.horaFin}`);
      }

      if (!cursoAsignadoCompleto) {
        logs.push(`⚠️ IMPOSIBLE ASIGNAR CURSO COMPLETO: ${curso.nombre} (Grupo ${grupo.nombre}). Sin docentes disponibles para cubrir toda su carga.`);
      }
    }
  }

  // 6. Guardar en base de datos
  if (asignacionesTemp.length > 0) {
    const dataToSave = asignacionesTemp.map(({ cursoId, ciclo, grupoNombre, prefijoCarrera, ...rest }) => rest);
    await prisma.asignacion.createMany({
      data: dataToSave
    });
  }

  return { exito: true, totalAsignado: asignacionesTemp.length, logs };
}
