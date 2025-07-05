"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, FormField } from "@/components/ui";

const LibreriaSchema = z.object({
  nombre_libreria: z.string().min(2, { message: "El nombre es obligatorio" }),
  sede: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email_contacto: z.string().email({ message: "Formato de email inválido" }).optional(),
  nombre_administrador_contacto: z.string().optional(),
  horario_atencion: z.string().optional(),
});

type LibreriaFormValues = z.infer<typeof LibreriaSchema>;

export function NuevaLibreriaForm() {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LibreriaFormValues>({
    resolver: zodResolver(LibreriaSchema),
  });

  const onSubmit = async (data: LibreriaFormValues) => {
    setMensaje(null);
    const supabase = createClient();
    const { error } = await supabase.from("librerias").insert([data]);
    if (error) {
      setMensaje("Error: " + error.message);
    } else {
      setMensaje("Librería creada correctamente");
      reset();
      window.location.reload();
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-lg font-bold mb-4">Agregar nueva librería</h2>
        
        <FormField
          label="Nombre"
          {...register("nombre_libreria")}
          error={errors.nombre_libreria?.message}
          placeholder="Nombre de la librería"
        />
        
        <FormField
          label="Sede"
          {...register("sede")}
          error={errors.sede?.message}
          placeholder="Sede"
        />
        
        <FormField
          label="Dirección"
          {...register("direccion")}
          error={errors.direccion?.message}
          placeholder="Dirección"
        />
        
        <FormField
          label="Teléfono"
          {...register("telefono")}
          error={errors.telefono?.message}
          placeholder="Teléfono"
        />
        
        <FormField
          label="Email de contacto"
          {...register("email_contacto")}
          error={errors.email_contacto?.message}
          placeholder="Email de contacto"
          type="email"
        />
        
        <FormField
          label="Nombre del administrador"
          {...register("nombre_administrador_contacto")}
          error={errors.nombre_administrador_contacto?.message}
          placeholder="Nombre del administrador"
        />
        
        <FormField
          label="Horario de atención"
          {...register("horario_atencion")}
          error={errors.horario_atencion?.message}
          placeholder="Horario de atención"
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Guardando..." : "Guardar librería"}
        </Button>
        
        {mensaje && (
          <p className={`text-sm ${mensaje.includes("Error") ? "text-red-500" : "text-green-500"}`}>
            {mensaje}
          </p>
        )}
      </form>
    </Card>
  );
}
