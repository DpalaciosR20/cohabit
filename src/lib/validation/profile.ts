import { z } from "zod";
import { PROFILE_COLORS } from "@/lib/profile-colors";

export const updateProfileSchema = z.object({
  color: z.enum(PROFILE_COLORS),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
