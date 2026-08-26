import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;

export const joinHouseholdSchema = z.object({
  inviteCode: z.string().trim().min(1, "El código de invitación es requerido"),
});

export type JoinHouseholdInput = z.infer<typeof joinHouseholdSchema>;
