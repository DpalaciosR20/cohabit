// Datos de prueba reutilizables para desarrollo local — corre con:
//   npx prisma db seed
// Usa upsert/count-guards, así que correrlo varias veces no duplica nada.
// Pensado SOLO para la base de datos de desarrollo (cohabit-dev), nunca para producción.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function splitEvenly(amount, memberIds, payerId) {
  const totalCents = Math.round(amount * 100);
  const n = memberIds.length;
  const baseCents = Math.floor(totalCents / n);
  let remainder = totalCents - baseCents * n;
  const ordered = [payerId, ...memberIds.filter((id) => id !== payerId)];
  return ordered.map((userId) => {
    const extraCent = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return { userId, shareAmount: (baseCents + extraCent) / 100 };
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const diego = await prisma.user.upsert({
    where: { email: "diego@example.com" },
    update: {},
    create: { name: "Diego", email: "diego@example.com", passwordHash },
  });

  const novia = await prisma.user.upsert({
    where: { email: "novia@example.com" },
    update: {},
    create: { name: "Novia", email: "novia@example.com", passwordHash },
  });

  const solo = await prisma.user.upsert({
    where: { email: "solo@example.com" },
    update: {},
    create: { name: "Solo Test", email: "solo@example.com", passwordHash },
  });

  let household = await prisma.household.findFirst({
    where: { name: "Depa de prueba" },
  });
  if (!household) {
    household = await prisma.household.create({
      data: {
        name: "Depa de prueba",
        members: {
          create: [
            { userId: diego.id, role: "OWNER" },
            { userId: novia.id, role: "MEMBER" },
          ],
        },
      },
    });
  }

  const categoryNames = ["Comida", "Servicios", "Entretenimiento"];
  const categories = {};
  for (const name of categoryNames) {
    categories[name] = await prisma.category.upsert({
      where: { householdId_name: { householdId: household.id, name } },
      update: {},
      create: { householdId: household.id, name },
    });
  }

  let list = await prisma.shoppingList.findFirst({
    where: { householdId: household.id },
  });
  if (!list) {
    list = await prisma.shoppingList.create({
      data: { householdId: household.id, name: "Lista de compras" },
    });
  }

  const existingItems = await prisma.shoppingItem.count({ where: { listId: list.id } });
  if (existingItems === 0) {
    await prisma.shoppingItem.createMany({
      data: [
        { listId: list.id, name: "Leche", quantity: 2, addedById: novia.id },
        { listId: list.id, name: "Huevos", quantity: 1, addedById: diego.id },
        {
          listId: list.id,
          name: "Papel higiénico",
          quantity: 1,
          addedById: novia.id,
          isPurchased: true,
          purchasedById: novia.id,
          purchasedAt: new Date(),
        },
        { listId: list.id, name: "Detergente", quantity: 1, addedById: diego.id },
      ],
    });
  }

  const existingExpenses = await prisma.expense.count({
    where: { householdId: household.id },
  });
  if (existingExpenses === 0) {
    const members = [diego.id, novia.id];

    async function addExpense(description, amount, paidById, categoryId, daysAgo) {
      const shares = splitEvenly(amount, members, paidById);
      await prisma.expense.create({
        data: {
          householdId: household.id,
          description,
          amount,
          paidById,
          categoryId,
          date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          splits: {
            create: shares.map((s) => ({ userId: s.userId, shareAmount: s.shareAmount })),
          },
        },
      });
    }

    await addExpense("Supermercado", 850.5, diego.id, categories["Comida"].id, 5);
    await addExpense("Cine", 320, novia.id, categories["Entretenimiento"].id, 3);
    await addExpense("Gas", 450, diego.id, categories["Servicios"].id, 10);
  }

  const existingBills = await prisma.bill.count({ where: { householdId: household.id } });
  if (existingBills === 0) {
    await prisma.bill.create({
      data: {
        householdId: household.id,
        name: "Internet",
        amount: 600,
        dueDay: 5,
        categoryId: categories["Servicios"].id,
      },
    });
    await prisma.bill.create({
      data: {
        householdId: household.id,
        name: "Laptop a meses",
        amount: 800,
        dueDay: 15,
        installmentsRemaining: 6,
      },
    });
  }

  console.log("Seed completo. Cuentas de prueba (contraseña: password123):");
  console.log(`  ${diego.email}  — en '${household.name}'`);
  console.log(`  ${novia.email}  — en '${household.name}'`);
  console.log(`  ${solo.email}   — sin hogar (para probar el flujo de crear/unirse)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
