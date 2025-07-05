import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default async function VerInstalacionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  
  // Obtener la instalación
  const { data: instalacion, error } = await supabase
    .from("instalaciones")
    .select("*")
    .eq("id", params.id)
    .single();
    
  if (error || !instalacion) {
    notFound();
  }
  
  // Obtener las piezas instaladas
  const { data: piezas } = await supabase
    .from("piezas_instaladas")
    .select("*")
    .eq("instalacion_id", params.id);
    
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalles de la instalación</h1>
        <div className="flex gap-2">
          <Link href={`/dashboard/editar/${params.id}`} passHref>
            <Button variant="outline">Editar</Button>
          </Link>
          <Link href="/dashboard" passHref>
            <Button variant="secondary">Volver</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Información de la librería</h2>
            <dl className="divide-y divide-gray-200">
              <div className="py-3">
                <dt className="text-sm font-medium text-gray-500">Nombre de librería</dt>
                <dd className="text-base mt-1">{instalacion.nombre_libreria}</dd>
              </div>
              {instalacion.sede && (
                <div className="py-3">
                  <dt className="text-sm font-medium text-gray-500">Sede</dt>
                  <dd className="text-base mt-1">{instalacion.sede}</dd>
                </div>
              )}
              {instalacion.direccion_libreria && (
                <div className="py-3">
                  <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                  <dd className="text-base mt-1">{instalacion.direccion_libreria}</dd>
                </div>
              )}
              {instalacion.telefono && (
                <div className="py-3">
                  <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                  <dd className="text-base mt-1">{instalacion.telefono}</dd>
                </div>
              )}
              {instalacion.correo_electronico && (
                <div className="py-3">
                  <dt className="text-sm font-medium text-gray-500">Correo electrónico</dt>
                  <dd className="text-base mt-1">{instalacion.correo_electronico}</dd>
                </div>
              )}
              {instalacion.nombre_administrador && (
                <div className="py-3">
                  <dt className="text-sm font-medium text-gray-500">Nombre del administrador</dt>
                  <dd className="text-base mt-1">{instalacion.nombre_administrador}</dd>
                </div>
              )}
              {instalacion.horario_atencion_libreria && (
                <div className="py-3">
                  <dt className="text-sm font-medium text-gray-500">Horario de atención</dt>
                  <dd className="text-base mt-1">{instalacion.horario_atencion_libreria}</dd>
                </div>
              )}
            </dl>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Información de la instalación</h2>
            <dl className="divide-y divide-gray-200">
              <div className="py-3">
                <dt className="text-sm font-medium text-gray-500">Fecha de creación</dt>
                <dd className="text-base mt-1">{formatDate(instalacion.created_at)}</dd>
              </div>
              <div className="py-3">
                <dt className="text-sm font-medium text-gray-500">Hora inicio instalación</dt>
                <dd className="text-base mt-1">{formatDate(instalacion.hora_inicio_instalacion)}</dd>
              </div>
              <div className="py-3">
                <dt className="text-sm font-medium text-gray-500">Hora fin instalación</dt>
                <dd className="text-base mt-1">{formatDate(instalacion.hora_fin_instalacion)}</dd>
              </div>
              {instalacion.isevento && (
                <>
                  <div className="py-3">
                    <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                    <dd className="text-base mt-1">Evento</dd>
                  </div>
                  {instalacion.nombre_persona_recibe && (
                    <div className="py-3">
                      <dt className="text-sm font-medium text-gray-500">Persona que recibe</dt>
                      <dd className="text-base mt-1">{instalacion.nombre_persona_recibe}</dd>
                    </div>
                  )}
                  {instalacion.cargo_persona_recibe && (
                    <div className="py-3">
                      <dt className="text-sm font-medium text-gray-500">Cargo</dt>
                      <dd className="text-base mt-1">{instalacion.cargo_persona_recibe}</dd>
                    </div>
                  )}
                </>
              )}
              {instalacion.latitud && instalacion.longitud && (
                <div className="py-3">
                  <dt className="text-sm font-medium text-gray-500">Ubicación</dt>
                  <dd className="text-base mt-1">
                    <Link 
                      href={`https://maps.google.com/?q=${instalacion.latitud},${instalacion.longitud}`}
                      target="_blank" 
                      className="text-blue-600 hover:underline"
                    >
                      Ver en Google Maps ({instalacion.latitud.toFixed(6)}, {instalacion.longitud.toFixed(6)})
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        
        {instalacion.comentarios && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Comentarios</h2>
            <p className="bg-gray-50 p-3 rounded">{instalacion.comentarios}</p>
          </div>
        )}

        {/* Mostrar fotos de la librería */}
        {instalacion.fotos_libreria && instalacion.fotos_libreria.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Fotos de la librería</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {instalacion.fotos_libreria.map((foto: string, idx: number) => (
                <div key={idx} className="aspect-square relative rounded overflow-hidden border">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos-librerias/${foto}`}
                    alt={`Foto ${idx + 1} de la librería`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mostrar fotos del espacio brandeado */}
        {instalacion.fotos_espacio_brandeado && instalacion.fotos_espacio_brandeado.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Fotos del espacio brandeado</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {instalacion.fotos_espacio_brandeado.map((foto: string, idx: number) => (
                <div key={idx} className="aspect-square relative rounded overflow-hidden border">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos-espacios/${foto}`}
                    alt={`Foto ${idx + 1} del espacio brandeado`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de piezas instaladas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Piezas instaladas</h2>
        {piezas && piezas.length > 0 ? (
          <div className="space-y-6">
            {piezas.map((pieza) => (
              <div key={pieza.id} className="border rounded-md p-4">
                <h3 className="font-semibold mb-2">{pieza.nombre_pieza}</h3>
                {pieza.medidas_pieza && (
                  <p className="text-sm text-gray-600 mb-2">Medidas: {pieza.medidas_pieza}</p>
                )}
                
                {/* Fotos de la pieza */}
                {pieza.fotos_pieza && pieza.fotos_pieza.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-semibold mb-2">Fotos:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {pieza.fotos_pieza.map((foto: string, idx: number) => (
                        <div key={idx} className="aspect-square relative rounded overflow-hidden border">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos-piezas/${foto}`}
                            alt={`Foto ${idx + 1} de la pieza ${pieza.nombre_pieza}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay piezas registradas para esta instalación.</p>
        )}
      </div>
    </div>
  );
}
