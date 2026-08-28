import { z } from "zod";

export const setHouseholdSplitSchema = z
  .object({
    shares: z
      .array(
        z.object({
          userId: z.string().min(1),
          percent: z.number().positive("Cada % debe ser mayor a cero").max(100),
        })
      )
      .min(1, "Debe incluir al menos un miembro"),
  })
  .refine(
    (data) => Math.abs(data.shares.reduce((sum, s) => sum + s.percent, 0) - 100) < 0.01,
    { message: "Los porcentajes deben sumar 100%", path: ["shares"] }
  );

export type SetHouseholdSplitInput = z.infer<typeof setHouseholdSplitSchema>;
