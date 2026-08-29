import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";

export const createBillSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es requerido").max(100),
    amount: z
      .number()
      .positive("El monto debe ser mayor a cero")
      .max(1_000_000, "El monto es demasiado grande"),
    dueDay: z.number().int().min(1, "Debe ser entre 1 y 31").max(31, "Debe ser entre 1 y 31"),
    installmentsRemaining: z.number().int().positive().nullable().optional(),
    totalInstallments: z.number().int().positive().nullable().optional(),
    category: z.enum(EXPENSE_CATEGORIES).nullable().optional(),
    // Formato "YYYY-MM" (lo que produce <input type="month">). Si no se manda,
    // el Bill empieza a generar vencimientos desde el mes actual.
    startsAt: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Formato de mes inválido")
      .optional(),
  })
  .refine(
    (data) =>
      !data.installmentsRemaining ||
      !data.totalInstallments ||
      data.installmentsRemaining <= data.totalInstallments,
    {
      message: "Las mensualidades restantes no pueden ser más que el total",
      path: ["installmentsRemaining"],
    }
  );

export type CreateBillInput = z.infer<typeof createBillSchema>;

// `installmentsRemaining` se omite a propósito: una vez que un Bill existe,
// esa cifra siempre se deriva en el servidor a partir de totalInstallments y
// los pagos ya registrados — nunca se acepta directamente del cliente, para
// que no se pueda desincronizar del historial real de pagos.
export const updateBillSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100).optional(),
  amount: z
    .number()
    .positive("El monto debe ser mayor a cero")
    .max(1_000_000, "El monto es demasiado grande")
    .optional(),
  dueDay: z.number().int().min(1, "Debe ser entre 1 y 31").max(31, "Debe ser entre 1 y 31").optional(),
  totalInstallments: z.number().int().positive().optional(),
  category: z.enum(EXPENSE_CATEGORIES).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateBillInput = z.infer<typeof updateBillSchema>;

export const payBillSchema = z.object({
  amount: z
    .number()
    .positive("El monto debe ser mayor a cero")
    .max(1_000_000, "El monto es demasiado grande"),
});

export type PayBillInput = z.infer<typeof payBillSchema>;
