"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Tipos para definir la estructura de los datos
type Pieza = {
  id?: string;
  instalacion_id?: string;
  nombre_pieza: string;
  medidas_pieza?: string;
  fotos_pieza?: FileList | null;
  _delete?: boolean;
};

type Instalacion = {
  id: string;
  nombre_libreria: string;
  sede?: string;
  direccion_libreria?: string;
  telefono?: string;
  correo_electronico?: string | null;
  nombre_administrador?: string;
  horario_atencion_libreria?: string;
  hora_inicio?: string;
  hora_fin?: string;
  horario_instalacion_publicidad?: string;
  horario_entrega_paquetes?: string;
  horario_instalacion_piezas?: string;
  comentarios?: string;
  isevento?: boolean;
  nombre_persona_recibe?: string;
  cargo_persona_recibe?: string;
  latitud?: number | null;
  longitud?: number | null;
};

type SupabaseClient = ReturnType<typeof createClient>;

// Esquema para validación
const FormularioEdicionSchema = z.object({
  nombre_libreria: z.string().min(1, { message: "El nombre de la librería es obligatorio" }),
  sede: z.string().optional(),
  direccion_libreria: z.string().optional(),
  telefono: z.string().optional(),
  correo_electronico: z.string().email({ message: "Formato de email inválido" }).optional().nullable(),
  nombre_administrador: z.string().optional(),
  horario_atencion_libreria: z.string().optional(),
  fotos_libreria: z.any(), // archivos
  hora_inicio: z.string().optional(),
  hora_fin: z.string().optional(),
  horario_instalacion_publicidad: z.string().optional(),
  horario_entrega_paquetes: z.string().optional(),
  horario_instalacion_piezas: z.string().optional(),
  fotos_espacio_brandeado: z.any(), // archivos
  comentarios: z.string().optional(),
  isevento: z.boolean().optional(),
  nombre_persona_recibe: z.string().optional(),
  cargo_persona_recibe: z.string().optional(),
  latitud: z.number().optional().nullable(),
  longitud: z.number().optional().nullable(),
  piezas_instaladas: z.array(
    z.object({
      id: z.string().optional(),
      nombre_pieza: z.string(),
      medidas_pieza: z.string().optional(),
      fotos_pieza: z.any(), // archivos
      _delete: z.boolean().optional(),
    })
  ),
});

type FormularioEdicionValues = z.infer<typeof FormularioEdicionSchema>;

export default function EditarInstalacion({ 
  instalacion, 
  piezas 
}: { 
  instalacion: Instalacion;
  piezas: Pieza[];
}) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Preparar los valores iniciales
  const initialValues = {
    ...instalacion,
    piezas_instaladas: piezas.map(p => ({
      id: p.id,
      instalacion_id: p.instalacion_id,
      nombre_pieza: p.nombre_pieza,
      medidas_pieza: p.medidas_pieza || "",
      fotos_pieza: null, // No podemos cargar los archivos existentes en el input
      _delete: false
    }))
  };

  // Si no hay piezas, añadir una vacía
  if (!initialValues.piezas_instaladas.length) {
    initialValues.piezas_instaladas = [{ nombre_pieza: "", medidas_pieza: "", fotos_pieza: null }];
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue
  } = useForm<FormularioEdicionValues>({
    resolver: zodResolver(FormularioEdicionSchema),
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "piezas_instaladas",
  });

  // Mostrar valores de geolocalización
  const hasLocation = instalacion.latitud && instalacion.longitud;

  const onSubmit = async (data: FormularioEdicionValues) => {
    setMensaje(null);
    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // 1. Actualizar el registro de instalación
      const { error: updateError } = await supabase
        .from("instalaciones")
        .update({
          nombre_libreria: data.nombre_libreria,
          sede: data.sede,
          direccion_libreria: data.direccion_libreria,
          telefono: data.telefono,
          correo_electronico: data.correo_electronico,
          nombre_administrador: data.nombre_administrador,
          horario_atencion_libreria: data.horario_atencion_libreria,
          hora_inicio_instalacion: data.hora_inicio,
          hora_fin_instalacion: data.hora_fin,
          horario_instalacion_publicidad: data.horario_instalacion_publicidad,
          horario_entrega_paquetes: data.horario_entrega_paquetes,
          horario_instalacion_piezas: data.horario_instalacion_piezas,
          comentarios: data.comentarios,
          isevento: data.isevento || false,
          nombre_persona_recibe: data.nombre_persona_recibe,
          cargo_persona_recibe: data.cargo_persona_recibe,
        })
        .eq("id", instalacion.id);
        
      if (updateError) throw new Error(`Error al actualizar la instalación: ${updateError.message}`);
      
      // 2. Manejar las piezas instaladas
      // 2.1. Identificar piezas a eliminar, actualizar o añadir
      for (const pieza of data.piezas_instaladas) {
        if (pieza.id && pieza._delete) {
          // Eliminar pieza existente
          const { error: deleteError } = await supabase
            .from("piezas_instaladas")
            .delete()
            .eq("id", pieza.id);
            
          if (deleteError) throw new Error(`Error al eliminar pieza: ${deleteError.message}`);
        } else if (pieza.id) {
          // Actualizar pieza existente
          const { error: updatePiezaError } = await supabase
            .from("piezas_instaladas")
            .update({
              nombre_pieza: pieza.nombre_pieza,
              medidas_pieza: pieza.medidas_pieza
            })
            .eq("id", pieza.id);
            
          if (updatePiezaError) throw new Error(`Error al actualizar pieza: ${updatePiezaError.message}`);
          
          // Subir nuevas fotos si se han añadido
          if (pieza.fotos_pieza && pieza.fotos_pieza.length > 0) {
            await uploadPhotos(supabase, pieza.fotos_pieza, pieza.id);
          }
        } else if (!pieza._delete) {
          // Añadir nueva pieza
          const { data: newPieza, error: insertError } = await supabase
            .from("piezas_instaladas")
            .insert({
              instalacion_id: instalacion.id,
              nombre_pieza: pieza.nombre_pieza,
              medidas_pieza: pieza.medidas_pieza,
              fotos_pieza: []
            })
            .select()
            .single();
            
          if (insertError) throw new Error(`Error al añadir pieza: ${insertError.message}`);
          
          // Subir fotos para la nueva pieza
          if (pieza.fotos_pieza && pieza.fotos_pieza.length > 0 && newPieza) {
            await uploadPhotos(supabase, pieza.fotos_pieza, newPieza.id);
          }
        }
      }
      
      setMensaje("Registro actualizado correctamente");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setMensaje(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Función para subir fotos
  const uploadPhotos = async (supabase: SupabaseClient, fileList: FileList, piezaId: string) => {
    const fotosPiezaUrls: string[] = [];
    
    for (const file of Array.from(fileList)) {
      const { data: upload, error: uploadError } = await supabase.storage
        .from("fotos-piezas")
        .upload(`pieza-${piezaId}-${Date.now()}-${file.name}`, file);
        
      if (uploadError) throw new Error(`Error al subir foto: ${uploadError.message}`);
      if (upload) fotosPiezaUrls.push(upload.path);
    }
    
    // Actualizar el campo fotos_pieza en la base de datos con las nuevas URLs
    if (fotosPiezaUrls.length > 0) {
      const { data: currentPieza } = await supabase
        .from("piezas_instaladas")
        .select("fotos_pieza")
        .eq("id", piezaId)
        .single();
      
      const currentFotos = currentPieza?.fotos_pieza || [];
      const updatedFotos = [...currentFotos, ...fotosPiezaUrls];
      
      await supabase
        .from("piezas_instaladas")
        .update({ fotos_pieza: updatedFotos })
        .eq("id", piezaId);
    }
    
    return fotosPiezaUrls;
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded shadow">
      {/* Sección de datos básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Nombre de la Librería *</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            {...register("nombre_libreria")}
          />
          {errors.nombre_libreria && (
            <p className="text-red-500 text-sm mt-1">{errors.nombre_libreria.message}</p>
          )}
        </div>
        <div>
          <label className="block font-medium mb-1">Sede</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            {...register("sede")}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Dirección</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            {...register("direccion_libreria")}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Teléfono</label>
          <input
            type="tel"
            className="border rounded px-3 py-2 w-full"
            {...register("telefono")}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Correo electrónico</label>
          <input
            type="email"
            className="border rounded px-3 py-2 w-full"
            {...register("correo_electronico")}
          />
          {errors.correo_electronico && (
            <p className="text-red-500 text-sm mt-1">{errors.correo_electronico.message}</p>
          )}
        </div>
        <div>
          <label className="block font-medium mb-1">Nombre del administrador</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            {...register("nombre_administrador")}
          />
        </div>
      </div>
      
      <div>
        <label className="block font-medium mb-1">Horario de atención</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full"
          {...register("horario_atencion_libreria")}
        />
      </div>
      
      {/* Sección de horarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Horario instalación publicidad</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            {...register("horario_instalacion_publicidad")}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Horario entrega paquetes</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            {...register("horario_entrega_paquetes")}
          />
        </div>
      </div>
      
      <div>
        <label className="block font-medium mb-1">Horario instalación piezas</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full"
          {...register("horario_instalacion_piezas")}
        />
      </div>
      
      {/* Sección de eventos */}
      <div className="border p-3 rounded bg-gray-50">
        <div className="flex items-center mb-3">
          <input
            id="isevento"
            type="checkbox"
            {...register("isevento")}
            className="h-5 w-5 rounded"
          />
          <label htmlFor="isevento" className="ml-2 block font-medium">
            ¿Es un evento?
          </label>
        </div>
        
        <div id="evento-fields" className="pl-7 space-y-4">
          <div>
            <label className="block font-medium mb-1">Nombre persona que recibe</label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              {...register("nombre_persona_recibe")}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Cargo persona que recibe</label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              {...register("cargo_persona_recibe")}
            />
          </div>
        </div>
      </div>
      
      {/* Sección de geolocalización */}
      {hasLocation && (
        <div className="bg-green-50 text-green-700 p-3 rounded">
          <p>Ubicación registrada: Latitud {instalacion.latitud.toFixed(6)}, Longitud {instalacion.longitud.toFixed(6)}</p>
        </div>
      )}
      
      {/* Sección de comentarios */}
      <div>
        <label className="block font-medium mb-1">Comentarios</label>
        <textarea
          {...register("comentarios")}
          className="border rounded px-3 py-2 w-full"
          rows={3}
        ></textarea>
      </div>
      
      {/* Sección de piezas instaladas */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Piezas instaladas</h3>
        {fields.map((field, idx) => (
          <div key={field.id} className="border p-3 mb-3 rounded relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Nombre de la pieza</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  {...register(`piezas_instaladas.${idx}.nombre_pieza` as const)}
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Medidas</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  {...register(`piezas_instaladas.${idx}.medidas_pieza` as const)}
                />
              </div>
            </div>
            
            <div className="mt-2">
              <label className="block font-medium mb-1">Fotos adicionales</label>
              <input
                type="file"
                className="border rounded px-3 py-2 w-full"
                multiple
                {...register(`piezas_instaladas.${idx}.fotos_pieza` as const)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Las fotos nuevas se agregarán a las existentes.
              </p>
            </div>
            
            <div className="mt-3 flex items-center">
              <input
                type="checkbox"
                id={`delete-${idx}`}
                className="h-4 w-4 text-red-600"
                {...register(`piezas_instaladas.${idx}._delete` as const)}
              />
              <label htmlFor={`delete-${idx}`} className="ml-2 text-sm text-red-600">
                Marcar para eliminar esta pieza
              </label>
            </div>
            
            {fields.length > 1 && (
              <button
                type="button"
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                onClick={() => {
                  if (field.id) {
                    // Si tiene ID, marcar para eliminar
                    setValue(`piezas_instaladas.${idx}._delete`, true);
                  } else {
                    // Si no tiene ID, eliminar del formulario
                    remove(idx);
                  }
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        
        <button
          type="button"
          className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 mt-2"
          onClick={() => append({ nombre_pieza: "", medidas_pieza: "", fotos_pieza: null })}
        >
          + Agregar nueva pieza
        </button>
      </div>
      
      {/* Botones de acción */}
      <div className="flex justify-between pt-4 border-t">
        <a 
          href="/dashboard"
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancelar
        </a>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
      
      {/* Mensaje de resultado */}
      {mensaje && (
        <div className={`p-3 rounded ${mensaje.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {mensaje}
        </div>
      )}
    </form>
  );
}
