"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";

const EditarLibreriaSchema = z.object({
  nombre_libreria: z.string().min(2),
  sede: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email_contacto: z.string().email().optional(),
  nombre_administrador_contacto: z.string().optional(),
  horario_atencion: z.string().optional(),
});

type EditarLibreriaFormValues = z.infer<typeof EditarLibreriaSchema>;

export function EditarLibreriaButton({ libreria }: { libreria: any }) {
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditarLibreriaFormValues>({
    resolver: zodResolver(EditarLibreriaSchema),
    defaultValues: libreria,
  });

  const onSubmit = async (data: EditarLibreriaFormValues) => {
    setMensaje(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("librerias")
      .update(data)
      .eq("id", libreria.id);
    if (error) setMensaje("Error: " + error.message);
    else {
      setMensaje("Actualizado");
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-blue-600 hover:underline mr-2"
        title="Editar"
      >
        Editar
      </button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-6 rounded shadow max-w-md w-full space-y-2"
          >
            <h2 className="font-bold mb-2">Editar Librería</h2>
            <input {...register("nombre_libreria")} placeholder="Nombre" className="border px-2 py-1 w-full" />
            {errors.nombre_libreria && <p className="text-red-500">{errors.nombre_libreria.message}</p>}
            <input {...register("sede")} placeholder="Sede" className="border px-2 py-1 w-full" />
            <input {...register("direccion")} placeholder="Dirección" className="border px-2 py-1 w-full" />
            <input {...register("telefono")} placeholder="Teléfono" className="border px-2 py-1 w-full" />
            <input {...register("email_contacto")} placeholder="Email contacto" className="border px-2 py-1 w-full" />
            <input {...register("nombre_administrador_contacto")} placeholder="Administrador" className="border px-2 py-1 w-full" />
            <input {...register("horario_atencion")} placeholder="Horario atención" className="border px-2 py-1 w-full" />
            <div className="flex gap-2 mt-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={isSubmitting}>
                Guardar
              </button>
              <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => setOpen(false)}>
                Cancelar
              </button>
            </div>
            {mensaje && <div className="mt-2 text-sm">{mensaje}</div>}
          </form>
        </div>
      )}
    </>
  );
}
