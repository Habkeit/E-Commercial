// lib/services/restaurant.service.ts
/**
 * Restaurant data access and business operations.
 */
import { db } from "@/db";
import { restaurants, categories, dishes, orders, users } from "@/db/schema";
import { eq, asc, and, or, ilike } from "drizzle-orm";
import { DISH_STATUS, type DishStatus } from "@/lib/constants";
import { archiveStripeProduct } from "./stripe.service";
import { uuidv7 } from "uuidv7";

export type RestaurantRecord = typeof restaurants.$inferSelect;
export type CategoryRecord = typeof categories.$inferSelect;

/**
 * Fetch a restaurant by the owner's Clerk ID or user ID.
 * Robustly checks both user UUID and Clerk ID.
 */
export async function getRestaurantByUserId(
  userId: string,
): Promise<RestaurantRecord | null> {
  const [directMatch] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.userId, userId))
    .limit(1);

  if (directMatch) return directMatch;

  const user = await db.query.users.findFirst({
    where: or(eq(users.clerkId, userId), eq(users.id, userId)),
  });

  if (user) {
    const [matched] = await db
      .select()
      .from(restaurants)
      .where(or(eq(restaurants.userId, user.id), eq(restaurants.userId, user.clerkId)))
      .limit(1);

    if (matched) return matched;
  }

  return null;
}

/**
 * Fetch all restaurants owned by a user (Clerk ID or user UUID).
 */
export async function getRestaurantsByUserId(
  userId: string,
): Promise<RestaurantRecord[]> {
  const user = await db.query.users.findFirst({
    where: or(eq(users.clerkId, userId), eq(users.id, userId)),
  });

  if (!user) {
    return db
      .select()
      .from(restaurants)
      .where(eq(restaurants.userId, userId));
  }

  return db
    .select()
    .from(restaurants)
    .where(or(eq(restaurants.userId, user.id), eq(restaurants.userId, user.clerkId)));
}

/**
 * Fetch list of restaurants matching search query for the food catalog page.
 */
export async function getRestaurants(
  searchQuery?: string,
): Promise<RestaurantRecord[]> {
  try {
    const data = await db.query.restaurants.findMany({
      where: searchQuery
        ? ilike(restaurants.name, `%${searchQuery}%`)
        : undefined,
    });
    return data;
  } catch (error) {
    console.error("Database query failed in getRestaurants:", error);
    return [];
  }
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
export async function getCategoriesByRestaurantId(restaurantId: string): Promise<CategoryRecord[]> {
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
 * Register a new restaurant record.
 */
export async function createRestaurant(data: {
  userId: string;
  name: string;
  houseNumber: string;
  street: string;
  ward: string;
  province: string;
  note?: string;
  openTime?: Date;
  closeTime?: Date;
}): Promise<RestaurantRecord> {
  const newId = uuidv7();
  const [created] = await db
    .insert(restaurants)
    .values({
      id: newId,
      userId: data.userId,
      name: data.name,
      houseNumber: data.houseNumber,
      street: data.street,
      ward: data.ward,
      province: data.province,
      openTime: data.openTime ?? new Date(),
      closeTime: data.closeTime ?? new Date(),
      note: data.note ?? "",
    })
    .returning();

  return created;
}

/**
 * Create a new menu category for a restaurant.
 */
export async function createCategory(data: {
  restaurantId: string;
  name: string;
  description?: string;
}): Promise<CategoryRecord> {
  const [created] = await db
    .insert(categories)
    .values({
      id: uuidv7(),
      restaurantId: data.restaurantId,
      name: data.name,
      description: data.description || null,
    })
    .returning();

  return created;
}

/**
 * Create a new dish record for a restaurant.
 */
export async function createDishRecord(data: {
  restaurantId: string;
  categoryId: string;
  name: string;
  price: number;
  stock: number;
  status: DishStatus;
  description?: string;
  stripePriceId?: string | null;
}) {
  const [created] = await db
    .insert(dishes)
    .values({
      id: uuidv7(),
      restaurantId: data.restaurantId,
      categoryId: data.categoryId,
      name: data.name,
      price: data.price.toString(),
      stock: data.stock,
      status: data.status,
      description: data.description || null,
      stripePriceId: data.stripePriceId ?? null,
    })
    .returning();

  return created;
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
