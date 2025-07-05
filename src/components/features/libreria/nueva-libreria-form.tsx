"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { crearLibreria } from "@/lib/actions/libreria-actions";
import { Button, Card, FormField } from "@/components/ui";

// El esquema de validación está ahora en @/lib/validators/libreria.schema.ts

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Guardando..." : "Guardar librería"}
    </Button>
  );
}

export function NuevaLibreriaForm() {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
  }>({});

  async function handleAction(formData: FormData) {
    setMensaje(null);
    const result = await crearLibreria(formData);
    
    if (result) {
      setFormState(result);
      if (result.success) {
        setMensaje("Librería creada correctamente");
        // No es necesario refrescar la página, Next.js revalidará automáticamente
      } else {
        setMensaje(`Error: ${result.message}`);
      }
    }
  }

  return (
    <Card className="p-6">
      <form action={handleAction} className="space-y-4">
        <h2 className="text-lg font-bold mb-4">Agregar nueva librería</h2>
        
        <FormField
          label="Nombre"
          name="nombre_libreria"
          placeholder="Nombre de la librería"
          error={formState.errors?.nombre_libreria?.join(", ")}
        />
        
        <FormField
          label="Sede"
          name="sede"
          placeholder="Sede"
          error={formState.errors?.sede?.join(", ")}
        />
        
        <FormField
          label="Dirección"
          name="direccion"
          placeholder="Dirección"
          error={formState.errors?.direccion?.join(", ")}
        />
        
        <FormField
          label="Teléfono"
          name="telefono"
          placeholder="Teléfono"
          error={formState.errors?.telefono?.join(", ")}
        />
        
        <FormField
          label="Email de contacto"
          name="email_contacto"
          placeholder="Email de contacto"
          type="email"
          error={formState.errors?.email_contacto?.join(", ")}
        />
        
        <FormField
          label="Nombre del administrador"
          name="nombre_administrador_contacto"
          placeholder="Nombre del administrador"
          error={formState.errors?.nombre_administrador_contacto?.join(", ")}
        />
        
        <FormField
          label="Horario de atención"
          name="horario_atencion"
          placeholder="Horario de atención"
          error={formState.errors?.horario_atencion?.join(", ")}
        />
        
        <SubmitButton />
        
        {mensaje && (
          <p className={`text-sm ${mensaje.includes("Error") ? "text-red-500" : "text-green-500"}`}>
            {mensaje}
          </p>
        )}
      </form>
    </Card>
  );
}
