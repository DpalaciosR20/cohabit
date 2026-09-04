import { z } from "zod";

export const upsertPersonalBudgetSchema = z.object({
  monthlyLimit: z
    .number()
    .positive("El límite debe ser mayor a cero")
    .max(1_000_000, "El límite es demasiado grande"),
});

export type UpsertPersonalBudgetInput = z.infer<typeof upsertPersonalBudgetSchema>;
