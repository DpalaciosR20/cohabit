import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  email: z.email("Correo inválido").toLowerCase().trim(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.email("Correo inválido").toLowerCase().trim(),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type SignInInput = z.infer<typeof signInSchema>;
