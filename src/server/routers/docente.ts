import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';

export const docenteRouter = router({
  list: publicProcedure.query(async () => {
    return await prisma.docente.findMany({
      select: {
        id: true,
        usuario: {
          select: {
            nombre: true,
          },
        },
        categoria: true,
        disponibilidad: true,
      },
      orderBy: { usuario: { nombre: 'asc' } },
    });
  }),
});
