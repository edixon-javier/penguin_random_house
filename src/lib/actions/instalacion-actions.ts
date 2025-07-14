'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface FormDataValues {
  [key: string]: string | number | boolean | null;
}

export async function crearInstalacion(formData: FormData) {
  const supabase = await createClient();
  
  // Manejar datos básicos de formulario
  const rawData: FormDataValues = {};
  formData.forEach((value, key) => {
    // Manejar campos booleanos
    if (key === 'isevento') {
      rawData[key] = value === 'on' || value === 'true';
    } else {
      rawData[key] = value.toString();
    }
  });
  
  // Obtener geolocalización si está disponible
  if (formData.get('latitud') && formData.get('longitud')) {
    rawData.latitud = parseFloat(formData.get('latitud') as string);
    rawData.longitud = parseFloat(formData.get('longitud') as string);
  }
  
  try {
    // Procesar archivos (fotos de la librería)
    const fotosLibreriaUrls: string[] = [];
    const fotosLibreria = formData.getAll('fotos_libreria');
    for (const foto of fotosLibreria) {
      if (foto instanceof File && foto.size > 0) {
        const fileName = `${Date.now()}-${foto.name}`;
        const { error: uploadError } = await supabase.storage
          .from("imagenes_instalaciones")
          .upload(`librerias/${fileName}`, foto);
        
        if (uploadError) throw new Error(`Error subiendo foto: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage
          .from("imagenes_instalaciones")
          .getPublicUrl(`librerias/${fileName}`);
        
        fotosLibreriaUrls.push(publicUrl);
      }
    }
    
    // Procesar fotos del espacio brandeado
    const fotosEspacioUrls: string[] = [];
    const fotosEspacio = formData.getAll('fotos_espacio_brandeado');
    for (const foto of fotosEspacio) {
      if (foto instanceof File && foto.size > 0) {
        const fileName = `${Date.now()}-${foto.name}`;
        const { error: uploadError } = await supabase.storage
          .from("imagenes_instalaciones")
          .upload(`espacios/${fileName}`, foto);
        
        if (uploadError) throw new Error(`Error subiendo foto: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage
          .from("imagenes_instalaciones")
          .getPublicUrl(`espacios/${fileName}`);
        
        fotosEspacioUrls.push(publicUrl);
      }
    }
    
    // Insertar la instalación principal
    const { error: instalacionError } = await supabase
      .from("instalaciones")
      .insert({
        nombre_libreria: formData.get('nombre_libreria'),
        sede: formData.get('sede'),
        direccion_libreria: formData.get('direccion_libreria'),
        telefono: formData.get('telefono'),
        correo_electronico: formData.get('correo_electronico'),
        nombre_administrador: formData.get('nombre_administrador'),
        horario_atencion_libreria: formData.get('horario_atencion_libreria'),
        fotos_libreria: fotosLibreriaUrls,
        hora_inicio: formData.get('hora_inicio') || new Date().toISOString(),
        hora_fin: formData.get('hora_fin') || new Date().toISOString(),
        horario_instalacion_publicidad: formData.get('horario_instalacion_publicidad'),
        horario_entrega_paquetes: formData.get('horario_entrega_paquetes'),
        horario_instalacion_piezas: formData.get('horario_instalacion_piezas'),
        fotos_espacio_brandeado: fotosEspacioUrls,
        comentarios: formData.get('comentarios'),
        isevento: formData.get('isevento') === 'on' || formData.get('isevento') === 'true',
        nombre_persona_recibe: formData.get('nombre_persona_recibe'),
        cargo_persona_recibe: formData.get('cargo_persona_recibe'),
        latitud: rawData.latitud,
        longitud: rawData.longitud
      });

    if (instalacionError) {
      throw new Error(`Error al crear la instalación: ${instalacionError.message}`);
    }

    revalidatePath("/dashboard");
    
    return {
      success: true,
      message: "Instalación creada correctamente"
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      message: errorMessage
    };
  }
}
