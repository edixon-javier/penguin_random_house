import { createClient } from "@/lib/supabase/server";
import { FormularioInstalacion } from "@/components/features/instalacion";

export default async function Home() {
  // Crear instancia del cliente Supabase (server-side)
  const supabase = await createClient();
  // Obtener lista de librerías
  const { data: librerias, error } = await supabase
    .from("librerias")
    .select("id, nombre_libreria, sede")
    .order("nombre_libreria", { ascending: true });

  if (error) {
    return (
      <div className="p-4 text-red-600">Error al cargar librerías: {error.message}</div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Registro de Instalación</h1>
      <FormularioInstalacion librerias={librerias || []} />
    </main>
  );
}
