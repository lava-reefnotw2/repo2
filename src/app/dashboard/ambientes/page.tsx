export const dynamic = 'force-dynamic';
import { getAmbientesAction } from "@/actions/ambiente.actions";
import AmbienteClient from "./AmbienteClient";

export default async function AmbientesPage() {
  const ambientes = await getAmbientesAction();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Ambientes</h2>
      </div>
      
      <AmbienteClient initialAmbientes={ambientes} />
    </div>
  );
}
