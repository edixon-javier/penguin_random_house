"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function EliminarLibreriaButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eliminar = async () => {
    if (!confirm("¿Seguro que deseas eliminar esta librería?")) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("librerias").delete().eq("id", id);
    setLoading(false);
    if (error) setError(error.message);
    else window.location.reload();
  };

  return (
    <button
      onClick={eliminar}
      className="text-red-600 hover:underline mr-2"
      disabled={loading}
      title="Eliminar"
    >
      Eliminar
      {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
    </button>
  );
}
