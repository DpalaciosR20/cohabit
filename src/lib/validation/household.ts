import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  targetMemberCount: z.number().int().min(1, "Debe ser al menos 1").max(20, "Debe ser 20 o menos").optional(),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;

export const joinHouseholdSchema = z.object({
  inviteCode: z.string().trim().min(1, "El código de invitación es requerido"),
});

export type JoinHouseholdInput = z.infer<typeof joinHouseholdSchema>;
