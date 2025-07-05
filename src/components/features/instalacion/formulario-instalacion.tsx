"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button, Card, FormField } from "@/components/ui";

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

interface FormularioInstalacionProps {
  librerias?: Array<{ id: string; nombre_libreria: string }>;
}

export function FormularioInstalacion({ librerias = [] }: FormularioInstalacionProps) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [geoLocation, setGeoLocation] = useState<{latitud: number; longitud: number} | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoRequested, setGeoRequested] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Marcar componente como montado en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Manejar la geolocalización
  useEffect(() => {
    if (geoRequested && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude
          });
          setGeoError(null);
        },
        (error) => {
          setGeoError(`Error de geolocalización: ${error.message}`);
        },
        { enableHighAccuracy: true }
      );
    }
  }, [geoRequested]);

  // Valores predeterminados iniciales
  const initialDefaultValues = useMemo(() => ({
    piezas_instaladas: [{ nombre_pieza: "", medidas_pieza: "", fotos_pieza: null }],
  }), []);
  
  // Cargar estado guardado del localStorage cuando el componente se monta
  const [defaultValues, setDefaultValues] = useState(initialDefaultValues);
  
  // Cargar formulario guardado al montar el componente
  useEffect(() => {
    if (typeof window !== "undefined" && mounted) {
      try {
        const savedForm = localStorage.getItem("instalacionForm");
        if (savedForm) {
          const parsedForm = JSON.parse(savedForm);
          setDefaultValues(parsedForm);
        }
      } catch (e) {
        console.error("Error cargando formulario guardado:", e);
      }
    }
  }, [mounted]);
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormularioInstalacionValues>({
    resolver: zodResolver(FormularioInstalacionSchema),
    defaultValues
  });
  
  // Setup para el array de piezas instaladas
  const { fields, append, remove } = useFieldArray({
    control,
    name: "piezas_instaladas"
  });
  
  // Guardar en localStorage cuando el formulario cambie
  const formValues = watch();
  const saveToLocalStorage = useCallback(() => {
    if (mounted && typeof window !== "undefined") {
      // Crear una copia sin los archivos
      const formCopy = { ...formValues };
      localStorage.setItem("instalacionForm", JSON.stringify(formCopy));
    }
  }, [formValues, mounted]);
  
  // Guardar cambios del formulario en localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToLocalStorage();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [formValues, saveToLocalStorage]);
  
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
        for (const foto of data.fotos_libreria) {
          if (foto instanceof File) {
            const fileName = `${Date.now()}-${foto.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("imagenes_instalaciones")
              .upload(`librerias/${fileName}`, foto);
            
            if (uploadError) throw new Error(`Error subiendo foto: ${uploadError.message}`);
            
            const { data: { publicUrl } } = supabase.storage
              .from("imagenes_instalaciones")
              .getPublicUrl(`librerias/${fileName}`);
            
            fotosLibreriaUrls.push(publicUrl);
          }
        }
      }
      
      // Subir fotos_espacio_brandeado
      const fotosEspacioUrls: string[] = [];
      if (data.fotos_espacio_brandeado && data.fotos_espacio_brandeado.length > 0) {
        for (const foto of data.fotos_espacio_brandeado) {
          if (foto instanceof File) {
            const fileName = `${Date.now()}-${foto.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("imagenes_instalaciones")
              .upload(`espacios/${fileName}`, foto);
            
            if (uploadError) throw new Error(`Error subiendo foto: ${uploadError.message}`);
            
            const { data: { publicUrl } } = supabase.storage
              .from("imagenes_instalaciones")
              .getPublicUrl(`espacios/${fileName}`);
            
            fotosEspacioUrls.push(publicUrl);
          }
        }
      }

      // Insertar la instalación principal
      const { data: instalacion, error: instalacionError } = await supabase
        .from("instalaciones")
        .insert({
          nombre_libreria: data.nombre_libreria,
          sede: data.sede,
          direccion_libreria: data.direccion_libreria,
          telefono: data.telefono,
          correo_electronico: data.correo_electronico,
          nombre_administrador: data.nombre_administrador,
          horario_atencion_libreria: data.horario_atencion_libreria,
          fotos_libreria: fotosLibreriaUrls,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          horario_instalacion_publicidad: data.horario_instalacion_publicidad,
          horario_entrega_paquetes: data.horario_entrega_paquetes,
          horario_instalacion_piezas: data.horario_instalacion_piezas,
          fotos_espacio_brandeado: fotosEspacioUrls,
          comentarios: data.comentarios,
          isevento: data.isevento || false,
          nombre_persona_recibe: data.nombre_persona_recibe,
          cargo_persona_recibe: data.cargo_persona_recibe,
          latitud: data.latitud,
          longitud: data.longitud
        })
        .select();
      
      if (instalacionError) throw new Error(`Error guardando instalación: ${instalacionError.message}`);

      // Subir piezas instaladas
      for (const pieza of data.piezas_instaladas) {
        const fotosPiezaUrls: string[] = [];
        
        if (pieza.fotos_pieza && pieza.fotos_pieza.length > 0) {
          for (const foto of pieza.fotos_pieza) {
            if (foto instanceof File) {
              const fileName = `${Date.now()}-${foto.name}`;
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from("imagenes_instalaciones")
                .upload(`piezas/${fileName}`, foto);
              
              if (uploadError) throw new Error(`Error subiendo foto de pieza: ${uploadError.message}`);
              
              const { data: { publicUrl } } = supabase.storage
                .from("imagenes_instalaciones")
                .getPublicUrl(`piezas/${fileName}`);
              
              fotosPiezaUrls.push(publicUrl);
            }
          }
        }

        const { error: piezaError } = await supabase
          .from("piezas_instaladas")
          .insert({
            instalacion_id: instalacion[0].id,
            nombre_pieza: pieza.nombre_pieza,
            medidas_pieza: pieza.medidas_pieza,
            fotos_pieza: fotosPiezaUrls
          });
        
        if (piezaError) throw new Error(`Error guardando pieza: ${piezaError.message}`);
      }

      // Limpiar localStorage después de guardar exitosamente
      localStorage.removeItem("instalacionForm");
      setMensaje("Instalación registrada correctamente");
      reset();
      
      // Redireccionar a la página de éxito
      window.location.href = "/dashboard";
      
    } catch (error) {
      setMensaje(`Error: ${error.message}`);
      console.error("Error en el proceso de subida:", error);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <h1 className="text-2xl font-bold mb-6">Registro de Instalación</h1>
        
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Datos de la Librería</h2>
          
          {librerias && librerias.length > 0 ? (
            <div className="space-y-4">
              <FormField
                label="Seleccionar librería"
                {...register("nombre_libreria")}
                error={errors.nombre_libreria?.message}
                as="select"
                className="w-full"
              >
                <option value="">-- Selecciona una librería --</option>
                {librerias.map((lib) => (
                  <option key={lib.id} value={lib.nombre_libreria}>
                    {lib.nombre_libreria}
                  </option>
                ))}
              </FormField>
            </div>
          ) : (
            <div className="space-y-4">
              <FormField
                label="Nombre de la librería"
                {...register("nombre_libreria")}
                error={errors.nombre_libreria?.message}
              />
              
              <FormField
                label="Sede"
                {...register("sede")}
              />
              
              <FormField
                label="Dirección"
                {...register("direccion_libreria")}
              />
              
              <FormField
                label="Teléfono"
                {...register("telefono")}
                type="tel"
              />
              
              <FormField
                label="Correo electrónico"
                {...register("correo_electronico")}
                type="email"
                error={errors.correo_electronico?.message}
              />
              
              <FormField
                label="Nombre del administrador"
                {...register("nombre_administrador")}
              />
              
              <FormField
                label="Horario de atención"
                {...register("horario_atencion_libreria")}
              />
            </div>
          )}
          
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Fotos de la librería
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  setValue('fotos_libreria', e.target.files);
                }}
                className="mt-1 block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
              />
            </label>
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Datos de la Instalación</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Hora de inicio"
              type="time"
              {...register("hora_inicio")}
            />
            
            <FormField
              label="Hora de fin"
              type="time"
              {...register("hora_fin")}
            />
          </div>
          
          <FormField
            label="Horario de instalación de publicidad"
            {...register("horario_instalacion_publicidad")}
          />
          
          <FormField
            label="Horario de entrega de paquetes"
            {...register("horario_entrega_paquetes")}
          />
          
          <FormField
            label="Horario de instalación de piezas"
            {...register("horario_instalacion_piezas")}
          />
          
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Fotos del espacio brandeado
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  setValue('fotos_espacio_brandeado', e.target.files);
                }}
                className="mt-1 block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
              />
            </label>
          </div>
          
          <FormField
            label="Comentarios"
            as="textarea"
            {...register("comentarios")}
            className="min-h-[100px]"
          />
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isevento"
              {...register("isevento")}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isevento" className="text-sm font-medium">
              Es un evento
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nombre de la persona que recibe"
              {...register("nombre_persona_recibe")}
            />
            
            <FormField
              label="Cargo de la persona que recibe"
              {...register("cargo_persona_recibe")}
            />
          </div>
          
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setGeoRequested(true)}
              disabled={!!geoLocation}
            >
              {geoLocation ? "Ubicación obtenida" : "Obtener ubicación actual"}
            </Button>
            
            {geoLocation && (
              <p className="text-sm text-green-600">
                Ubicación obtenida: {geoLocation.latitud}, {geoLocation.longitud}
              </p>
            )}
            
            {geoError && <p className="text-sm text-red-500">{geoError}</p>}
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Piezas Instaladas</h2>
          
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Pieza {index + 1}</h3>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
              
              <FormField
                label="Nombre de la pieza"
                {...register(`piezas_instaladas.${index}.nombre_pieza`)}
                error={errors.piezas_instaladas?.[index]?.nombre_pieza?.message}
              />
              
              <FormField
                label="Medidas"
                {...register(`piezas_instaladas.${index}.medidas_pieza`)}
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Fotos de la pieza
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      setValue(`piezas_instaladas.${index}.fotos_pieza`, e.target.files);
                    }}
                    className="mt-1 block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90"
                  />
                </label>
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ nombre_pieza: "", medidas_pieza: "", fotos_pieza: null })}
          >
            Agregar otra pieza
          </Button>
          
          {errors.piezas_instaladas && (
            <p className="text-sm text-red-500">{errors.piezas_instaladas.message}</p>
          )}
        </div>
        
        <div className="pt-6 border-t">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Guardando..." : "Guardar instalación"}
          </Button>
          
          {mensaje && (
            <p className={`mt-4 text-sm ${mensaje.includes("Error") ? "text-red-500" : "text-green-500"}`}>
              {mensaje}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}
