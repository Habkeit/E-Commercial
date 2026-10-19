// lib/services/dish.service.ts
/**
 * Dish data access and business logic.
 * Bulk queries for stock validation eliminate N+1 patterns in checkout.
 */
import { db } from "@/db";
import { dishes } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export type DishRecord = typeof dishes.$inferSelect;

/**
 * Fetch multiple dishes by IDs in a single query.
 * Returns a Map keyed by dish ID for O(1) lookups.
 *
 * This replaces the N+1 pattern where each dish was queried individually
 * inside a loop during checkout stock validation.
 */
export async function getDishesByIds(
  dishIds: string[],
): Promise<Map<string, DishRecord>> {
  if (dishIds.length === 0) return new Map();

  const results = await db
    .select()
    .from(dishes)
    .where(inArray(dishes.id, dishIds));

  return new Map(results.map((d) => [d.id, d]));
}

/**
 * Validate stock availability for a list of cart items.
 * Uses a single bulk query instead of N individual queries.
 *
 * Returns null if all items pass validation, or an error message string.
 */
export async function validateStock(
  items: Array<{ dishId: string; dishName: string; quantity: number }>,
): Promise<string | null> {
  const dishMap = await getDishesByIds(items.map((i) => i.dishId));

  for (const item of items) {
    const dish = dishMap.get(item.dishId);

    if (!dish) {
      return `Dish "${item.dishName}" no longer exists on the system.`;
    }

    if (dish.stock < item.quantity) {
      return `Sorry! Dish "${item.dishName}" only has ${dish.stock} left.`;
    }
  }

  return null;
}

/**
 * Decrement stock for a single dish and update its active status.
 */
export async function decrementStock(
  dishId: string,
  quantity: number,
): Promise<void> {
  const [currentDish] = await db
    .select()
    .from(dishes)
    .where(eq(dishes.id, dishId));

  if (currentDish) {
    const newStock = currentDish.stock - quantity;
    await db
      .update(dishes)
      .set({ stock: newStock, isActive: newStock > 0 })
      .where(eq(dishes.id, dishId));
  }
}

/**
 * Decrement stock for multiple dishes in batch.
 * Eliminates N+1 select & update loops in the Stripe webhook.
 */
export async function decrementStockBatch(
  items: Array<{ dishId: string; quantity: number }>,
): Promise<void> {
  if (items.length === 0) return;

  const dishMap = await getDishesByIds(items.map((i) => i.dishId));

  await db.transaction(async (tx) => {
    for (const item of items) {
      const currentDish = dishMap.get(item.dishId);
      if (currentDish) {
        const newStock = Math.max(0, currentDish.stock - item.quantity);
        await tx
          .update(dishes)
          .set({
            stock: newStock,
            isActive: newStock > 0,
            status: newStock === 0 ? "inactive" : currentDish.status,
            updatedAt: new Date(),
          })
          .where(eq(dishes.id, item.dishId));
      }
    }
  });
}

/**
 * Fetch a single dish with its associated restaurant details.
 * Used directly by Server Components (e.g. food detail page) to avoid
 * the anti-pattern of fetching internal Next.js API routes over HTTP.
 */
export async function getDishByIdWithRestaurant(dishId: string) {
  const dish = await db.query.dishes.findFirst({
    where: eq(dishes.id, dishId),
    with: {
      restaurant: true,
    },
  });

  return dish ?? null;
}

/**
 * Batch-update stripePriceId for dishes that were lazily provisioned on Stripe.
 */
export async function updateStripePriceIds(
  updates: Array<{ dishId: string; stripePriceId: string }>,
): Promise<void> {
  if (updates.length === 0) return;

  await Promise.all(
    updates.map(({ dishId, stripePriceId }) =>
      db
        .update(dishes)
        .set({ stripePriceId, updatedAt: new Date() })
        .where(eq(dishes.id, dishId)),
    ),
  );
}

