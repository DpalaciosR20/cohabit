import { z } from "zod";

export const createShoppingItemSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  quantity: z.number().int().min(1).max(999).default(1),
});

export type CreateShoppingItemInput = z.infer<typeof createShoppingItemSchema>;

export const updateShoppingItemSchema = z.object({
  isPurchased: z.boolean(),
});

export type UpdateShoppingItemInput = z.infer<typeof updateShoppingItemSchema>;
