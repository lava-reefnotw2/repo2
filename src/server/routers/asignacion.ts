import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';
import { DiaSemana, TipoAmbiente } from '@prisma/client';

export const asignacionRouter = router({
  create: publicProcedure
    .input(
      z.object({
        periodoId: z.string(),
        grupoId: z.string(),
        docenteId: z.string(),
        ambienteId: z.string(),
        dia: z.nativeEnum(DiaSemana),
        horaInicio: z.string(),
        horaFin: z.string(),
        tipo: z.nativeEnum(TipoAmbiente),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      // Validar cruce de docente (solapamiento de horarios)
      const cruceDocente = await prisma.asignacion.findFirst({
        where: {
          periodoId: input.periodoId,
          docenteId: input.docenteId,
          dia: input.dia,
          OR: [
            {
              AND: [
                { horaInicio: { lte: input.horaInicio } },
                { horaFin: { gt: input.horaInicio } },
              ],
            },
            {
              AND: [
                { horaInicio: { lt: input.horaFin } },
                { horaFin: { gte: input.horaFin } },
              ],
            },
            {
              AND: [
                { horaInicio: { gte: input.horaInicio } },
                { horaFin: { lte: input.horaFin } },
              ],
            },
          ],
        },
      });

      if (cruceDocente) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `El docente ya tiene una sesión asignada en este horario (${cruceDocente.horaInicio}-${cruceDocente.horaFin}).`,
        });
      }

      // Validar cruce de ambiente (solapamiento de horarios)
      const cruceAmbiente = await prisma.asignacion.findFirst({
        where: {
          periodoId: input.periodoId,
          ambienteId: input.ambienteId,
          dia: input.dia,
          OR: [
            {
              AND: [
                { horaInicio: { lte: input.horaInicio } },
                { horaFin: { gt: input.horaInicio } },
              ],
            },
            {
              AND: [
                { horaInicio: { lt: input.horaFin } },
                { horaFin: { gte: input.horaFin } },
              ],
            },
            {
              AND: [
                { horaInicio: { gte: input.horaInicio } },
                { horaFin: { lte: input.horaFin } },
              ],
            },
          ],
        },
      });

      if (cruceAmbiente) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `El ambiente ya está ocupado en este horario (${cruceAmbiente.horaInicio}-${cruceAmbiente.horaFin}).`,
        });
      }

      // Validar cruce de grupo (solapamiento de horarios para el mismo grupo)
      const cruceGrupo = await prisma.asignacion.findFirst({
        where: {
          periodoId: input.periodoId,
          grupoId: input.grupoId,
          dia: input.dia,
          OR: [
            {
              AND: [
                { horaInicio: { lte: input.horaInicio } },
                { horaFin: { gt: input.horaInicio } },
              ],
            },
            {
              AND: [
                { horaInicio: { lt: input.horaFin } },
                { horaFin: { gte: input.horaFin } },
              ],
            },
            {
              AND: [
                { horaInicio: { gte: input.horaInicio } },
                { horaFin: { lte: input.horaFin } },
              ],
            },
          ],
        },
      });

      if (cruceGrupo) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `El grupo ya tiene una sesión asignada en este horario (${cruceGrupo.horaInicio}-${cruceGrupo.horaFin}).`,
        });
      }

      return await prisma.asignacion.create({
        data: input,
      });
    }),

  listByPeriodo: publicProcedure
    .input(z.object({ periodoId: z.string() }))
    .query(async ({ input }: { input: { periodoId: string } }) => {
      return await prisma.asignacion.findMany({
        where: { periodoId: input.periodoId },
        include: {
          grupo: {
            include: {
              curso: true,
            },
          },
          docente: {
            include: {
              usuario: true,
            },
          },
          ambiente: true,
        },
        orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }],
      });
    }),

  listBySemestreEscuela: publicProcedure
    .input(z.object({ semestre: z.string(), escuela: z.string() }))
    .query(async ({ input }) => {
      return await prisma.asignacion.findMany({
        where: {
          periodo: {
            semestre: input.semestre,
            escuela: input.escuela
          }
        },
        include: {
          grupo: {
            include: {
              curso: true,
            },
          },
          docente: {
            include: {
              usuario: true,
            },
          },
          ambiente: true,
        },
        orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }],
      });
    }),

  sugerirSlotLibre: publicProcedure
    .input(z.object({
      periodoId: z.string(),
      tipo: z.nativeEnum(TipoAmbiente),
      grupoId: z.string(),
      horasRequeridas: z.number().default(2) // Defaults to 2 for now based on standard blocks
    }))
    .mutation(async ({ input }) => {
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
        return bloques;
      }
      
      const bloquesDinamicos = generarBloques(input.horasRequeridas);
      const DIAS = Object.values(DiaSemana);

      const asignaciones = await prisma.asignacion.findMany({
        where: { periodoId: input.periodoId }
      });

      const docentes = await prisma.docente.findMany({
        orderBy: [
          { tipo: "asc" },
          { categoria: "asc" },
          { fechaIngreso: "asc" }
        ]
      });

      const ambientes = await prisma.ambiente.findMany({
        where: { tipo: input.tipo }
      });

      function isDisponible(docenteId: string, ambienteId: string, grupoId: string, dia: DiaSemana, inicio: string, fin: string) {
        return !asignaciones.some((a) => 
          a.dia === dia && 
          (
            (a.horaInicio <= inicio && a.horaFin > inicio) ||
            (a.horaInicio < fin && a.horaFin >= fin) ||
            (a.horaInicio >= inicio && a.horaFin <= fin)
          ) &&
          (a.docenteId === docenteId || a.ambienteId === ambienteId || a.grupoId === grupoId)
        );
      }

      for (const docente of docentes) {
        for (const dia of DIAS) {
          for (const bloque of bloquesDinamicos) {
            const ambienteLibre = ambientes.find((amb) => isDisponible(docente.id, amb.id, input.grupoId, dia, bloque.inicio, bloque.fin));
            if (ambienteLibre) {
              return {
                dia,
                horaInicio: bloque.inicio,
                horaFin: bloque.fin,
                ambienteId: ambienteLibre.id,
                docenteId: docente.id
              };
            }
          }
        }
      }
      return null;
    }),

  generarAutomatico: publicProcedure
    .input(z.object({
      semestre: z.string(),
      escuela: z.string(),
      ciclo: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { generarHorariosAutomagicamente } = await import('@/lib/scheduler/engine');
      return await generarHorariosAutomagicamente(input.semestre, input.escuela, input.ciclo);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.asignacion.delete({
        where: { id: input.id },
      });
    }),
});
