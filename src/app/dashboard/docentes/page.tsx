export const dynamic = 'force-dynamic';
import { getDocentesAction } from "@/actions/docente.actions";
import DocenteClient from "./DocenteClient";

export default async function DocentesPage() {
  const docentes = await getDocentesAction();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Docentes</h2>
      </div>
      
      <DocenteClient initialDocentes={docentes} />
    </div>
  );
}
