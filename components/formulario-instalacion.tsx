"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useMemo, useCallback } from "react";

// Esquema básico, se expandirá en el siguiente paso
const FormularioInstalacionSchema = z.object({
  nombre_libreria: z.string().min(1, { message: "El nombre de la librería es obligatorio" }),
  sede: z.string().optional(),
  direccion_libreria: z.string().optional(),
  telefono: z.string().optional(),
  correo_electronico: z.string().email({ message: "Formato de email inválido" }).optional(),
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
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  piezas_instaladas: z
    .array(
      z.object({
        nombre_pieza: z.string(),
        medidas_pieza: z.string().optional(),
        fotos_pieza: z.any(), // archivos
      })
    )
    .min(1, { message: "Agrega al menos una pieza instalada" }),
});

type FormularioInstalacionValues = z.infer<typeof FormularioInstalacionSchema>;

export default function FormularioInstalacion() {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [geoLocation, setGeoLocation] = useState<{latitud: number; longitud: number} | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoRequested, setGeoRequested] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Marcar componente como montado en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Función para solicitar geolocalización manualmente
  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización");
      return;
    }
    
    setGeoRequested(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLocation({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
        });
      },
      (error) => {
        setGeoError(`Error al obtener la geolocalización: ${error.message}`);
      }
    );
  };

  // Función segura para localStorage que solo se ejecuta en el cliente
  const saveToLocalStorage = (data: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;
    
    try {
      // No guardar archivos binarios en localStorage
      const storableData = { ...data };
      if (storableData.fotos_libreria) delete storableData.fotos_libreria;
      if (storableData.fotos_espacio_brandeado) delete storableData.fotos_espacio_brandeado;
      
      // Eliminar archivos de piezas
      if (storableData.piezas_instaladas) {
        storableData.piezas_instaladas = (storableData.piezas_instaladas as Record<string, unknown>[]).map((pieza) => {
          // Usamos desestructuración para extraer fotos_pieza pero no la usamos
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { fotos_pieza, ...rest } = pieza as { fotos_pieza?: unknown, [key: string]: unknown };
          return rest;
        });
      }
      
      localStorage.setItem('formulario-instalacion-draft', JSON.stringify(storableData));
    } catch (error) {
      console.error("Error guardando en localStorage:", error);
    }
  };

  // Valores por defecto iniciales
  const initialDefaultValues = useMemo(() => ({ 
    piezas_instaladas: [{ nombre_pieza: "" }] 
  }), []);
  
  // Función segura para cargar de localStorage que solo se ejecuta en el cliente
  const loadFromLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return initialDefaultValues;
    
    try {
      const savedData = localStorage.getItem('formulario-instalacion-draft');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error("Error cargando de localStorage:", error);
    }
    return initialDefaultValues;
  }, [initialDefaultValues]);

  // Usar estado para mantener los valores por defecto
  const [defaultValues, setDefaultValues] = useState(initialDefaultValues);
  
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormularioInstalacionValues>({
    resolver: zodResolver(FormularioInstalacionSchema),
    defaultValues: initialDefaultValues, // Usamos valores iniciales básicos para SSR
  });
  
  // Configurar campos de array
  const { fields, append, remove } = useFieldArray({
    control,
    name: "piezas_instaladas",
  });
  
  // Cargar datos del localStorage solo cuando el componente está montado en el cliente
  useEffect(() => {
    if (mounted) {
      const savedValues = loadFromLocalStorage();
      setDefaultValues(savedValues);
    }
  }, [mounted, loadFromLocalStorage]);
  
  // Actualizar el formulario cuando los valores predeterminados cambian (después de cargar de localStorage)
  useEffect(() => {
    if (mounted && defaultValues !== initialDefaultValues) {
      // Reinicializar el formulario con los valores cargados
      Object.entries(defaultValues).forEach(([key, value]) => {
        // Solo actualizar si la clave existe y tiene valor
        if (value !== undefined && value !== null && key !== "piezas_instaladas") {
          setValue(key as keyof FormularioInstalacionValues, value);
        }
      });
      
      // Manejar el array de piezas por separado si existe
      if (defaultValues.piezas_instaladas && Array.isArray(defaultValues.piezas_instaladas)) {
        defaultValues.piezas_instaladas.forEach((pieza: Record<string, unknown>, index: number) => {
          if (index > 0) {
            // Añadir campos adicionales si hay más piezas que el campo inicial
            append({ nombre_pieza: "", fotos_pieza: null });
          }
          
          // Actualizar los valores de las piezas
          Object.entries(pieza).forEach(([pieceKey, pieceValue]) => {
            if (pieceValue !== undefined && pieceValue !== null && pieceKey !== "fotos_pieza") {
              // Usamos setValue con casting a any para evitar problemas de tipos
              setValue(`piezas_instaladas.${index}.${pieceKey}` as any, pieceValue as string);
            }
          });
        });
      }
    }
  }, [defaultValues, mounted, setValue, append, initialDefaultValues]);

  const onSubmit = async (data: FormularioInstalacionValues) => {
    setMensaje(null);
    const supabase = createClient();

    // Agregar la geolocalización si está disponible
    if (geoLocation) {
      data.latitud = geoLocation.latitud;
      data.longitud = geoLocation.longitud;
    }

    // Obtener hora actual si no se establecieron
    const now = new Date();
    const horaInicio = data.hora_inicio || now.toISOString();
    const horaFin = data.hora_fin || now.toISOString();

    try {
      // Subir fotos_libreria
      const fotosLibreriaUrls: string[] = [];
      if (data.fotos_libreria && data.fotos_libreria.length > 0) {
        for (const file of Array.from(data.fotos_libreria as FileList)) {
          const { data: upload, error: uploadError } = await supabase.storage
            .from("fotos-librerias")
            .upload(`libreria-${Date.now()}-${file.name}`, file);
            
          if (uploadError) {
            console.error("Error al subir foto de librería:", uploadError);
            throw new Error(`Error al subir foto de librería: ${uploadError.message}`);
          }
          
          if (upload) fotosLibreriaUrls.push(upload.path);
        }
      }
      
      // Subir fotos_espacio_brandeado
      const fotosEspacioUrls: string[] = [];
      if (data.fotos_espacio_brandeado && data.fotos_espacio_brandeado.length > 0) {
        for (const file of Array.from(data.fotos_espacio_brandeado as FileList)) {
          const { data: upload, error: uploadError } = await supabase.storage
            .from("fotos-espacios")
            .upload(`espacio-${Date.now()}-${file.name}`, file);
            
          if (uploadError) {
            console.error("Error al subir foto de espacio:", uploadError);
            throw new Error(`Error al subir foto de espacio: ${uploadError.message}`);
          }
          
          if (upload) fotosEspacioUrls.push(upload.path);
        }
      }
      
      // Subir fotos de piezas y preparar array para inserción
      const piezas = await Promise.all(
        data.piezas_instaladas.map(async (pieza, idx) => {
          const fotosPiezaUrls: string[] = [];
          if (pieza.fotos_pieza && pieza.fotos_pieza.length > 0) {
            for (const file of Array.from(pieza.fotos_pieza as FileList)) {
              const { data: upload, error: uploadError } = await supabase.storage
                .from("fotos-piezas")
                .upload(`pieza-${idx}-${Date.now()}-${file.name}`, file);
                
              if (uploadError) {
                console.error("Error al subir foto de pieza:", uploadError);
                throw new Error(`Error al subir foto de pieza: ${uploadError.message}`);
              }
              
              if (upload) fotosPiezaUrls.push(upload.path);
            }
          }
          return {
            nombre_pieza: pieza.nombre_pieza,
            medidas_pieza: pieza.medidas_pieza,
            fotos_pieza: fotosPiezaUrls,
          };
        })
      );
      
      // Insertar registro principal
      const { data: instalacion, error } = await supabase
        .from("instalaciones")
        .insert({
          nombre_libreria: data.nombre_libreria,
          sede: data.sede,
          direccion_libreria: data.direccion_libreria,
          telefono: data.telefono,
          correo_electronico: data.correo_electronico,
          nombre_administrador: data.nombre_administrador,
          horario_atencion_libreria: data.horario_atencion_libreria,
          hora_inicio_instalacion: horaInicio,
          hora_fin_instalacion: horaFin,
          latitud: data.latitud,
          longitud: data.longitud,
          fotos_libreria: fotosLibreriaUrls,
          horario_instalacion_publicidad: data.horario_instalacion_publicidad,
          horario_entrega_paquetes: data.horario_entrega_paquetes,
          horario_instalacion_piezas: data.horario_instalacion_piezas,
          fotos_espacio_brandeado: fotosEspacioUrls,
          comentarios: data.comentarios,
          isevento: data.isevento || false,
          nombre_persona_recibe: data.nombre_persona_recibe,
          cargo_persona_recibe: data.cargo_persona_recibe,
        })
        .select()
        .single();
        
      if (error || !instalacion) {
        setMensaje("Error al guardar: " + (error?.message || ""));
        return;
      }
      
      // Insertar piezas_instaladas
      for (const pieza of piezas) {
        await supabase.from("piezas_instaladas").insert({
          instalacion_id: instalacion.id,
          ...pieza,
        });
      }
      
      // Limpiar localStorage al completar
      localStorage.removeItem('formulario-instalacion-draft');
      setMensaje("Registro guardado correctamente");
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setMensaje(`Error al guardar: ${errorMessage}`);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-6"
      onChange={(e) => {
        if (mounted && typeof window !== 'undefined') {
          try {
            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData.entries());
            saveToLocalStorage(data);
          } catch (error) {
            console.error("Error al guardar en localStorage:", error);
          }
        }
      }}
    >
      {/* suppressHydrationWarning para evitar errores de hidratación */}
      <div suppressHydrationWarning>
        {!mounted ? (
          <div className="bg-gray-50 text-gray-700 p-2 rounded text-sm">
            Cargando formulario...
          </div>
        ) : !geoRequested ? (
          <div className="bg-blue-50 text-blue-700 p-3 rounded text-sm">
            <p className="mb-2">Necesitamos acceder a tu ubicación para registrar correctamente la instalación.</p>
            <button 
              type="button"
              onClick={requestGeolocation}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Permitir acceso a mi ubicación
            </button>
          </div>
        ) : geoLocation ? (
          <div className="bg-green-50 text-green-700 p-2 rounded text-sm">
            Ubicación detectada: Latitud {geoLocation.latitud.toFixed(6)}, Longitud {geoLocation.longitud.toFixed(6)}
          </div>
        ) : geoError ? (
          <div className="bg-red-50 text-red-700 p-2 rounded text-sm">
            <p className="mb-2">{geoError}</p>
            <button 
              type="button"
              onClick={requestGeolocation}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 text-blue-700 p-2 rounded text-sm flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Solicitando acceso a ubicación...
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Hora de inicio instalación</label>
          <input
            type="datetime-local"
            className="border rounded px-3 py-2 w-full"
            {...register("hora_inicio")}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Hora de fin instalación</label>
          <input
            type="datetime-local"
            className="border rounded px-3 py-2 w-full"
            {...register("hora_fin")}
          />
        </div>
      </div>
      
      <div>
        <label className="block font-medium mb-1">Nombre de la Librería *</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full"
          {...register("nombre_libreria")}
        />
        {errors.nombre_libreria && (
          <p className="text-red-500 text-sm mt-1">
            {errors.nombre_libreria.message?.toString()}
          </p>
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
      <div>
        <label className="block font-medium mb-1">Dirección de la librería</label>
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
      <div>
        <label className="block font-medium mb-1">Correo electrónico</label>
        <input
          type="email"
          className="border rounded px-3 py-2 w-full"
          {...register("correo_electronico")}
        />
        {errors.correo_electronico && (
          <p className="text-red-500 text-sm mt-1">
            {errors.correo_electronico.message?.toString()}
          </p>
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
      <div>
        <label className="block font-medium mb-1">Horario de atención de la librería</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full"
          {...register("horario_atencion_libreria")}
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Fotos de la librería</label>
        <input
          type="file"
          {...register("fotos_libreria")}
          className="border rounded px-3 py-2 w-full"
          multiple
          accept="image/*"
        />
      </div>
      <div>
        <label className="block font-medium mb-1">
          Horario instalación publicidad
        </label>
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
      <div>
        <label className="block font-medium mb-1">Horario instalación piezas</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full"
          {...register("horario_instalacion_piezas")}
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Fotos del espacio brandeado</label>
        <input
          type="file"
          {...register("fotos_espacio_brandeado")}
          className="border rounded px-3 py-2 w-full"
          multiple
        />
        {errors.fotos_espacio_brandeado && (
          <p className="text-red-500 text-sm mt-1">
            {errors.fotos_espacio_brandeado.message?.toString()}
          </p>
        )}
      </div>
      <div>
        <label className="block font-medium mb-1">Comentarios</label>
        <textarea
          {...register("comentarios")}
          className="border rounded px-3 py-2 w-full"
          rows={3}
        ></textarea>
      </div>
      
      {/* Toggle para isEvento */}
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
        
        {/* Campos que solo se muestran si isEvento está activo */}
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
      
      <div suppressHydrationWarning>
        {!mounted ? (
          <div className="border p-2 rounded bg-gray-50">
            <p className="text-gray-500">Cargando piezas instaladas...</p>
          </div>
        ) : (
          <>
            <label className="block font-medium mb-1">Piezas instaladas</label>
            {fields.map((field, idx) => (
              <div key={field.id} className="border p-2 mb-2 rounded">
                <input
                  type="text"
                  placeholder="Nombre de la pieza"
                  className="border rounded px-2 py-1 w-full mb-1"
                  {...register(`piezas_instaladas.${idx}.nombre_pieza` as const)}
                />
                <input
                  type="text"
                  placeholder="Medidas"
                  className="border rounded px-2 py-1 w-full mb-1"
                  {...register(`piezas_instaladas.${idx}.medidas_pieza` as const)}
                />
                <input
                  type="file"
                  {...register(`piezas_instaladas.${idx}.fotos_pieza` as const)}
                  multiple
                  accept="image/*"
                />
                <button
                  type="button"
                  className="text-red-600 mt-1"
                  onClick={() => remove(idx)}
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              className="bg-gray-200 px-2 py-1 rounded"
              onClick={() => append({ nombre_pieza: "", fotos_pieza: null })}
            >
              Agregar pieza instalada
            </button>
          </>
        )}
      </div>
      
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Guardando..." : "Enviar registro"}
      </button>
      {mensaje && (
        <p
          className={`mt-4 text-sm ${
            mensaje.startsWith("Error") ? "text-red-500" : "text-green-500"
          }`}
        >
          {mensaje}
        </p>
      )}
    </form>
  );
}
