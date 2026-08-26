import { z } from "zod";

export const createExpenseSchema = z.object({
  description: z.string().trim().min(1, "La descripción es requerida").max(200),
  amount: z
    .number()
    .positive("El monto debe ser mayor a cero")
    .max(1_000_000, "El monto es demasiado grande"),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema;

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
