"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, ConfirmDialog } from "@/components/ui";

interface EliminarLibreriaButtonProps {
  id: string;
}

export function EliminarLibreriaButton({ id }: EliminarLibreriaButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const eliminar = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("librerias").delete().eq("id", id);
    setLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <Button 
        onClick={() => setConfirmOpen(true)} 
        variant="destructive"
        size="sm"
        disabled={loading}
      >
        Eliminar
      </Button>
      
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar librería"
        description="¿Estás seguro que deseas eliminar esta librería? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={eliminar}
        variant="destructive"
        isLoading={loading}
      />
      
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </>
  );
}
