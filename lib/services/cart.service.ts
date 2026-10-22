// lib/services/cart.service.ts
/**
 * Shopping cart domain queries and mutations.
 * Centralizes all shopping cart database interactions.
 */
import { db } from "@/db";
import { cartItems, dishes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { uuidv7 } from "uuidv7";

export interface CartItemDetail {
  cartId: string;
  quantity: number;
  note: string | null;
  dishId: string;
  dishName: string;
  dishPrice: string;
  stripePriceId: string | null;
  createdAt: Date;
}

/**
 * Fetch all cart items for a given user, joined with dish details.
 */
export async function getCartForUser(userId: string): Promise<CartItemDetail[]> {
  const items = await db
    .select({
      cartId: cartItems.id,
      quantity: cartItems.quantity,
      note: cartItems.note,
      dishId: dishes.id,
      dishName: dishes.name,
      dishPrice: dishes.price,
      stripePriceId: dishes.stripePriceId,
      createdAt: cartItems.createdAt,
    })
    .from(cartItems)
    .innerJoin(dishes, eq(cartItems.dishId, dishes.id))
    .where(eq(cartItems.userId, userId))
    .orderBy(desc(cartItems.createdAt));

  return items;
}

/**
 * Add an item to the user's cart or increment its quantity if it already exists.
 */
export async function addOrUpdateCartItem(
  userId: string,
  dishId: string,
  quantity: number = 1,
  note?: string | null,
): Promise<void> {
  const [existingItem] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.dishId, dishId)));

  if (existingItem) {
    await db
      .update(cartItems)
      .set({
        quantity: existingItem.quantity + quantity,
        note: note !== undefined ? note : existingItem.note,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, existingItem.id));
  } else {
    await db.insert(cartItems).values({
      id: uuidv7(),
      userId,
      dishId,
      quantity: Math.max(1, quantity),
      note: note || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

/**
 * Increment, decrement, or remove a specific cart item by its primary key.
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  action: "increase" | "decrease" | "remove",
): Promise<void> {
  const [item] = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.id, cartItemId));

  if (!item) return;

  if (action === "remove") {
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  } else if (action === "increase") {
    await db
      .update(cartItems)
      .set({ quantity: item.quantity + 1, updatedAt: new Date() })
      .where(eq(cartItems.id, cartItemId));
  } else if (action === "decrease") {
    if (item.quantity > 1) {
      await db
        .update(cartItems)
        .set({ quantity: item.quantity - 1, updatedAt: new Date() })
        .where(eq(cartItems.id, cartItemId));
    } else {
      await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
    }
  }
}

/**
 * Remove a specific dish from a user's cart.
 */
export async function removeCartItem(
  userId: string,
  dishId: string,
): Promise<void> {
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.dishId, dishId)));
}

/**
 * Clear all cart items for a given user.
 * Supports passing an external database transaction (used by Stripe webhook).
 */
export async function clearCartForUser(
  userId: string,
  txOrDb: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0] = db,
): Promise<void> {
  await txOrDb.delete(cartItems).where(eq(cartItems.userId, userId));
}
