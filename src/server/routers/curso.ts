import { router, publicProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';

export const cursoRouter = router({
  list: publicProcedure.query(async () => {
    return await prisma.curso.findMany({
      select: {
        id: true,
        nombre: true,
        codigo: true,
        ciclo: true,
        horasTeoria: true,
        horasLab: true,
        grupos: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }),
});
