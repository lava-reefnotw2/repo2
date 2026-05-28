import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';
import { TipoAmbiente } from '@prisma/client';

export const ambienteRouter = router({
  listByTipo: publicProcedure
    .input(z.object({ tipo: z.nativeEnum(TipoAmbiente) }))
    .query(async ({ input }: { input: { tipo: TipoAmbiente } }) => {
      return await prisma.ambiente.findMany({
        where: { tipo: input.tipo },
        select: {
          id: true,
          nombre: true,
          capacidad: true,
        },
        orderBy: { nombre: 'asc' },
      });
    }),
});
