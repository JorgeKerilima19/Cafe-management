// lib/inventory.ts
import { prisma } from "@/lib/prisma";

type OrderItemForInventory = {
  menuItemId: string;
  quantity: number;
};

/**
 * Deducts inventory for a list of order items based on their recipes.
 * Wrapped in a transaction so if any deduction fails, all roll back.
 */
export async function deductInventoryForOrder(
  items: OrderItemForInventory[],
): Promise<void> {
  // 1. Collect all deductions grouped by inventoryItemId
  const deductions = new Map<string, number>();

  for (const item of items) {
    const recipe = await prisma.recipe.findUnique({
      where: { menuItemId: item.menuItemId },
      include: { ingredients: true },
    });

    if (!recipe) continue; // No recipe = no deduction (coffee, etc.)

    for (const ingredient of recipe.ingredients) {
      const totalDeduction = ingredient.quantityRequired * item.quantity;
      const current = deductions.get(ingredient.inventoryItemId) || 0;
      deductions.set(ingredient.inventoryItemId, current + totalDeduction);
    }
  }

  if (deductions.size === 0) return;

  // 2. Apply all deductions in a single transaction
  await prisma.$transaction(
    Array.from(deductions.entries()).map(([inventoryItemId, amount]) =>
      prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { quantity: { decrement: amount } },
      }),
    ),
  );
}

/**
 * Returns inventory for a list of order items (used when voiding an order).
 */
export async function returnInventoryForOrder(
  items: OrderItemForInventory[],
): Promise<void> {
  const returns = new Map<string, number>();

  for (const item of items) {
    const recipe = await prisma.recipe.findUnique({
      where: { menuItemId: item.menuItemId },
      include: { ingredients: true },
    });

    if (!recipe) continue;

    for (const ingredient of recipe.ingredients) {
      const totalReturn = ingredient.quantityRequired * item.quantity;
      const current = returns.get(ingredient.inventoryItemId) || 0;
      returns.set(ingredient.inventoryItemId, current + totalReturn);
    }
  }

  if (returns.size === 0) return;

  await prisma.$transaction(
    Array.from(returns.entries()).map(([inventoryItemId, amount]) =>
      prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { quantity: { increment: amount } },
      }),
    ),
  );
}
