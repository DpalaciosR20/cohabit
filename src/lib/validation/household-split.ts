import { z } from "zod";

const manualShareSchema = z.object({
  userId: z.string().min(1),
  percent: z.number().positive("Cada % debe ser mayor a cero").max(100),
});

export const setHouseholdSplitSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("EVEN") }),
  z
    .object({
      mode: z.literal("MANUAL"),
      shares: z.array(manualShareSchema).min(1, "Debe incluir al menos un miembro"),
    })
    .refine(
      (data) => Math.abs(data.shares.reduce((sum, s) => sum + s.percent, 0) - 100) < 0.01,
      { message: "Los porcentajes deben sumar 100%", path: ["shares"] }
    ),
  z.object({ mode: z.literal("INCOME") }),
]);

export type SetHouseholdSplitInput = z.infer<typeof setHouseholdSplitSchema>;
