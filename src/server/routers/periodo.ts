import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';

export const periodoRouter = router({
  list: publicProcedure.query(async () => {
    return await prisma.periodo.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }),
  findOrCreate: publicProcedure
    .input(
      z.object({
        semestre: z.string(),
        escuela: z.string(),
        ciclo: z.number(),
      })
    )
    .mutation(async ({ input }: { input: { semestre: string, escuela: string, ciclo: number } }) => {
      const { semestre, escuela, ciclo } = input;
      const periodo = await prisma.periodo.upsert({
        where: {
          semestre_escuela_ciclo: {
            semestre,
            escuela,
            ciclo,
          },
        },
        update: {},
        create: {
          semestre,
          escuela,
          ciclo,
        },
      });
      return { id: periodo.id };
    }),
});
