import { z } from "zod";

export const createSettlementSchema = z.object({
  toUserId: z.string().min(1, "Selecciona a quién le pagaste"),
  amount: z
    .number()
    .positive("El monto debe ser mayor a cero")
    .max(1_000_000, "El monto es demasiado grande"),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
