import { z } from "zod";
import { PROFILE_COLORS } from "@/lib/profile-colors";

export const updateProfileSchema = z.object({
  color: z.enum(PROFILE_COLORS).optional(),
  // Privado — solo se usa para calcular el % del split en modo INCOME,
  // nunca se expone el valor a otros miembros del hogar. null lo borra.
  monthlyIncome: z
    .number()
    .positive("El ingreso debe ser mayor a cero")
    .max(10_000_000, "El ingreso es demasiado grande")
    .nullable()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
