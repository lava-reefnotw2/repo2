import { router } from '../trpc';
import { periodoRouter } from './periodo';
import { cursoRouter } from './curso';
import { ambienteRouter } from './ambiente';
import { docenteRouter } from './docente';
import { asignacionRouter } from './asignacion';

export const appRouter = router({
  periodo: periodoRouter,
  curso: cursoRouter,
  ambiente: ambienteRouter,
  docente: docenteRouter,
  asignacion: asignacionRouter,
});

export type AppRouter = typeof appRouter;
