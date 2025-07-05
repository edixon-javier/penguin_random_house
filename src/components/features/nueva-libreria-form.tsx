"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";

const LibreriaSchema = z.object({
  nombre_libreria: z.string().min(2),
  sede: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email_contacto: z.string().email().optional(),
  nombre_administrador_contacto: z.string().optional(),
  horario_atencion: z.string().optional(),
});

type LibreriaFormValues = z.infer<typeof LibreriaSchema>;

export default function NuevaLibreriaForm() {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border p-4 rounded">
      <h2 className="font-bold">Agregar nueva librería</h2>
      <input {...register("nombre_libreria")} placeholder="Nombre" className="border px-2 py-1 w-full" />
      {errors.nombre_libreria && <p className="text-red-500">{errors.nombre_libreria.message}</p>}
      <input {...register("sede")} placeholder="Sede" className="border px-2 py-1 w-full" />
      <input {...register("direccion")} placeholder="Dirección" className="border px-2 py-1 w-full" />
      <input {...register("telefono")} placeholder="Teléfono" className="border px-2 py-1 w-full" />
      <input {...register("email_contacto")} placeholder="Email contacto" className="border px-2 py-1 w-full" />
      <input {...register("nombre_administrador_contacto")} placeholder="Administrador" className="border px-2 py-1 w-full" />
      <input {...register("horario_atencion")} placeholder="Horario atención" className="border px-2 py-1 w-full" />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={isSubmitting}>
        Guardar
      </button>
      {mensaje && <div className="mt-2 text-sm">{mensaje}</div>}
    </form>
  );
}
