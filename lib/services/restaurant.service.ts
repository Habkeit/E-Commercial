// lib/services/restaurant.service.ts
/**
 * Restaurant data access and business operations.
 */
import { db } from "@/db";
import { restaurants, categories, dishes, orders } from "@/db/schema";
import { eq, asc, and, or } from "drizzle-orm";
import { DISH_STATUS } from "@/lib/constants";
import { archiveStripeProduct } from "./stripe.service";

export type RestaurantRecord = typeof restaurants.$inferSelect;

/**
 * Fetch a restaurant by the owner's Clerk ID or user ID.
 */
export async function getRestaurantByUserId(
  userId: string,
): Promise<RestaurantRecord | null> {
  const result = await db
    .select()
    .from(restaurants)
    .where(or(eq(restaurants.userId, userId), eq(restaurants.userId, userId)))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Fetch a restaurant by its primary UUID.
 */
export async function getRestaurantById(
  id: string,
): Promise<RestaurantRecord | null> {
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, id));

  return restaurant ?? null;
}

/**
 * Fetch categories for a restaurant ordered by sort order.
 */
export async function getCategoriesByRestaurantId(restaurantId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, restaurantId))
    .orderBy(asc(categories.sortOrder));
}

/**
 * Fetch all dishes for a restaurant, ordered by dish name.
 */
export async function getDishesByRestaurantId(restaurantId: string) {
  return db
    .select()
    .from(dishes)
    .where(eq(dishes.restaurantId, restaurantId))
    .orderBy(dishes.name);
}

/**
 * Fetch active and pre-order dishes for customer-facing restaurant detail page.
 */
export async function getPublicDishesByRestaurantId(restaurantId: string) {
  return db
    .select()
    .from(dishes)
    .where(
      and(
        eq(dishes.restaurantId, restaurantId),
        or(
          eq(dishes.status, DISH_STATUS.ACTIVE),
          eq(dishes.status, DISH_STATUS.PRE_ORDER),
        ),
      ),
    );
}

/**
 * Update restaurant basic information.
 */
export async function updateRestaurant(
  restaurantId: string,
  data: {
    name: string;
    houseNumber: string;
    street: string;
    ward: string;
    province: string;
  },
): Promise<void> {
  await db
    .update(restaurants)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(restaurants.id, restaurantId));
}

/**
 * Delete a restaurant and all associated dishes/categories if no orders exist.
 * Archives any associated Stripe products.
 */
export async function deleteRestaurant(
  restaurantId: string,
): Promise<{ success: boolean; error?: string }> {
  const existingOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.restaurantId, restaurantId))
    .limit(1);

  if (existingOrders.length > 0) {
    return {
      success: false,
      error: "Cannot delete restaurant that has existing orders.",
    };
  }

  // Archive stripe products for dishes before deletion
  const restaurantDishes = await db
    .select()
    .from(dishes)
    .where(eq(dishes.restaurantId, restaurantId));

  for (const dish of restaurantDishes) {
    if (dish.stripePriceId) {
      await archiveStripeProduct(dish.stripePriceId);
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(dishes).where(eq(dishes.restaurantId, restaurantId));
    await tx.delete(categories).where(eq(categories.restaurantId, restaurantId));
    await tx.delete(restaurants).where(eq(restaurants.id, restaurantId));
  });

  return { success: true };
}
