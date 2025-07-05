"use client";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function DashboardActions({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eliminarRegistro = async () => {
    if (!confirm("¿Estás seguro que deseas eliminar este registro?")) return;
    
    setLoading(true);
    setError(null);
    const supabase = createClient();
    
    // Primero eliminar las piezas instaladas asociadas
    const { error: piezasError } = await supabase
      .from("piezas_instaladas")
      .delete()
      .eq("instalacion_id", id);
      
    if (piezasError) {
      setLoading(false);
      setError(piezasError.message);
      return;
    }
    
    // Luego eliminar el registro principal
    const { error: instError } = await supabase
      .from("instalaciones")
      .delete()
      .eq("id", id);
      
    setLoading(false);
    
    if (instError) {
      setError(instError.message);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={eliminarRegistro}
        className="text-red-600 hover:underline"
        disabled={loading}
      >
        {loading ? "Eliminando..." : "Eliminar"}
      </button>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
}
