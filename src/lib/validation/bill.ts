import { z } from "zod";

export const createBillSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  amount: z
    .number()
    .positive("El monto debe ser mayor a cero")
    .max(1_000_000, "El monto es demasiado grande"),
  dueDay: z.number().int().min(1, "Debe ser entre 1 y 31").max(31, "Debe ser entre 1 y 31"),
  installmentsRemaining: z.number().int().positive().nullable().optional(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

export const payBillSchema = z.object({
  amount: z
    .number()
    .positive("El monto debe ser mayor a cero")
    .max(1_000_000, "El monto es demasiado grande"),
});

export type PayBillInput = z.infer<typeof payBillSchema>;
