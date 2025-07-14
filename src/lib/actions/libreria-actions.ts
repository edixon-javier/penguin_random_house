'use server';

import { createClient } from "@/lib/supabase/server";
import { libreriaSchema } from "@/lib/validators/libreria.schema";
import { revalidatePath } from "next/cache";

export async function crearLibreria(formData: FormData) {
  const supabase = await createClient();
  
  // Convertir FormData a un objeto plano
  const rawData: Record<string, string> = {};
  formData.forEach((value, key) => {
    rawData[key] = value.toString();
  });
  
  // Validar datos usando el esquema Zod
  const validationResult = libreriaSchema.safeParse(rawData);
  
  if (!validationResult.success) {
    // Si hay errores de validación, retornar los errores
    return {
      success: false,
      errors: validationResult.error.format(),
      message: "Error de validación"
    };
  }
  
  const validatedData = validationResult.data;
  
  try {
    // Insertar la librería en la base de datos
    const { data, error } = await supabase
      .from("librerias")
      .insert([validatedData])
      .select();
    
    if (error) {
      return {
        success: false,
        message: `Error al crear la librería: ${error.message}`,
        data: null
      };
    }
    
    // Revalidar la página para actualizar los datos
    revalidatePath("/dashboard");
    
    return {
      success: true,
      message: "Librería creada correctamente",
      data
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error inesperado";
    return {
      success: false,
      message: errorMessage,
      data: null
    };
  }
}
