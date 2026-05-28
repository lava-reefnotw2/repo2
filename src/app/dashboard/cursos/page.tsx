export const dynamic = 'force-dynamic';
import { getCursosAction } from "@/actions/curso.actions";
import CursoClient from "./CursoClient";

export default async function CursosPage() {
  const cursos = await getCursosAction();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Cursos</h2>
      </div>
      
      <CursoClient initialCursos={cursos} />
    </div>
  );
}
