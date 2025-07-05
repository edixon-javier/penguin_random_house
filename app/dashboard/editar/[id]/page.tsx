import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EditarInstalacion from "./editar-instalacion";

export default async function EditarInstalacionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  
  // Verificar autenticación
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    redirect("/auth/login");
  }
  
  // Obtener datos de la instalación
  const { data: instalacion, error } = await supabase
    .from("instalaciones")
    .select("*")
    .eq("id", params.id)
    .single();
    
  if (error || !instalacion) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Error</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded mb-6">
          No se pudo cargar la instalación: {error?.message || "Registro no encontrado"}
        </div>
        <a href="/dashboard" className="text-blue-600 hover:underline">
          Volver al dashboard
        </a>
      </div>
    );
  }
  
  // Obtener las piezas instaladas
  const { data: piezas } = await supabase
    .from("piezas_instaladas")
    .select("*")
    .eq("instalacion_id", params.id);
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Editar Instalación</h1>
      <div className="mb-6">
        <a href="/dashboard" className="text-blue-600 hover:underline">
          ← Volver al dashboard
        </a>
      </div>
      <EditarInstalacion instalacion={instalacion} piezas={piezas || []} />
    </div>
  );
}
