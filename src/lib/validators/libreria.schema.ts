import * as z from "zod";

export const libreriaSchema = z.object({
  nombre_libreria: z.string().min(2, { message: "El nombre es obligatorio" }),
  sede: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email_contacto: z.string().email({ message: "Formato de email inválido" }).optional(),
  nombre_administrador_contacto: z.string().optional(),
  horario_atencion: z.string().optional(),
});

export type LibreriaFormValues = z.infer<typeof libreriaSchema>;
