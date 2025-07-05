"use client";
import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { Button, Card, FormField } from "@/components/ui";
import { crearInstalacion } from "@/lib/actions/instalacion-actions";

// El esquema ahora está en @/lib/validators/instalacion.schema.ts

interface FormularioInstalacionProps {
  librerias?: Array<{ id: string; nombre_libreria: string }>;
}

function SubmitButton() {
  return (
    <Button type="submit" className="w-full">
      Guardar instalación
    </Button>
  );
}

export function FormularioInstalacion({ librerias = [] }: FormularioInstalacionProps) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [geoLocation, setGeoLocation] = useState<{latitud: number; longitud: number} | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoRequested, setGeoRequested] = useState(false);
  const [piezasCount, setPiezasCount] = useState(1);
  
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
  
  // Manejador para el formulario usando Server Actions
  const handleFormSubmit = async (formData: FormData) => {
    // Agregar la geolocalización si está disponible
    if (geoLocation) {
      formData.append('latitud', geoLocation.latitud.toString());
      formData.append('longitud', geoLocation.longitud.toString());
    }
    
    // Llamar al Server Action
    try {
      await crearInstalacion(formData);
      // No necesitamos hacer nada más aquí porque el Server Action
      // se encargará de la redirección en caso de éxito
    } catch (error) {
      setMensaje(`Error: ${error.message}`);
    }
  };

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
      <form action={handleFormSubmit} className="space-y-6">
        <h1 className="text-2xl font-bold mb-6">Registro de Instalación</h1>
        
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Datos de la Librería</h2>
          
          {librerias && librerias.length > 0 ? (
            <div className="space-y-4">
              <FormField
                label="Seleccionar librería"
                name="nombre_libreria"
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
                name="nombre_libreria"
              />
              
              <FormField
                label="Sede"
                name="sede"
              />
              
              <FormField
                label="Dirección"
                name="direccion_libreria"
              />
              
              <FormField
                label="Teléfono"
                name="telefono"
                type="tel"
              />
              
              <FormField
                label="Correo electrónico"
                name="correo_electronico"
                type="email"
              />
              
              <FormField
                label="Nombre del administrador"
                name="nombre_administrador"
              />
              
              <FormField
                label="Horario de atención"
                name="horario_atencion_libreria"
              />
            </div>
          )}
          
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Fotos de la librería
              <input
                type="file"
                name="fotos_libreria"
                multiple
                accept="image/*"
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
              name="hora_inicio"
              type="time"
            />
            
            <FormField
              label="Hora de fin"
              name="hora_fin"
              type="time"
            />
          </div>
          
          <FormField
            label="Horario de instalación de publicidad"
            name="horario_instalacion_publicidad"
          />
          
          <FormField
            label="Horario de entrega de paquetes"
            name="horario_entrega_paquetes"
          />
          
          <FormField
            label="Horario de instalación de piezas"
            name="horario_instalacion_piezas"
          />
          
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Fotos del espacio brandeado
              <input
                type="file"
                name="fotos_espacio_brandeado"
                multiple
                accept="image/*"
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
            name="comentarios"
            as="textarea"
            className="min-h-[100px]"
          />
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isevento"
              name="isevento"
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isevento" className="text-sm font-medium">
              Es un evento
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nombre de la persona que recibe"
              name="nombre_persona_recibe"
            />
            
            <FormField
              label="Cargo de la persona que recibe"
              name="cargo_persona_recibe"
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
          
          {/* En una implementación de Server Actions real, necesitaríamos una forma más avanzada
              de manejar arrays dinámicos de inputs. Para este ejemplo, simplificamos a un solo elemento */}
          <div className="p-4 border rounded-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Pieza 1</h3>
            </div>
            
            <FormField
              label="Nombre de la pieza"
              name="piezas_instaladas[0].nombre_pieza"
            />
            
            <FormField
              label="Medidas"
              name="piezas_instaladas[0].medidas_pieza"
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Fotos de la pieza
                <input
                  type="file"
                  multiple
                  name="piezas_instaladas[0].fotos_pieza"
                  accept="image/*"
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
          
          {/* En una implementación completa, necesitaríamos JavaScript para manejar la adición de más piezas */}
          <p className="text-xs text-gray-500">
            Nota: Para agregar más piezas, se requeriría JavaScript adicional para manejar la adición dinámica de elementos al formulario.
          </p>
        </div>
        
        <div className="pt-6 border-t">
          <Button type="submit" className="w-full">
            Guardar instalación
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
