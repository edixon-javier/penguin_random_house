import * as z from "zod";

export const instalacionSchema = z.object({
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

export type InstalacionFormValues = z.infer<typeof instalacionSchema>;
