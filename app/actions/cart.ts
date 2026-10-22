"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "@/lib/services/user.service";
import {
  getCartForUser,
  addOrUpdateCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCartForUser,
} from "@/lib/services/cart.service";

/**
 * Fetch the authenticated user's current shopping cart items.
 */
export async function getCartAction() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: true, cart: [] };
  }

  const currentUser = await getOrCreateUser(clerkId);
  const items = await getCartForUser(currentUser.id);

  const formattedCart = items.map((item) => ({
    dishId: item.dishId,
    name: item.dishName,
    price: Number(item.dishPrice),
    quantity: item.quantity,
    note: item.note || undefined,
  }));

  return { success: true, cart: formattedCart };
}

/**
 * Add an item or increment quantity in the authenticated user's cart.
 */
export async function addToCartAction(
  dishId: string,
  quantity: number = 1,
  note?: string,
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, message: "Please sign in to add items to your cart." };
  }

  const currentUser = await getOrCreateUser(clerkId);
  await addOrUpdateCartItem(currentUser.id, dishId, quantity, note);

  revalidatePath("/cart");
  return { success: true };
}

/**
 * Update quantity or remove cart item via FormData (used by CartItemQuantity component).
 */
export async function updateCartItemQuantityAction(formData: FormData) {
  const cartId = formData.get("cartId") as string;
  const action = formData.get("action") as "increase" | "decrease" | "remove";

  if (!cartId || !action) return;

  await updateCartItemQuantity(cartId, action);
  revalidatePath("/cart");
}

/**
 * Remove an item from the authenticated user's cart by dish ID.
 */
export async function removeFromCartAction(dishId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, message: "Unauthorized" };
  }

  const currentUser = await getOrCreateUser(clerkId);
  await removeCartItem(currentUser.id, dishId);

  revalidatePath("/cart");
  return { success: true };
}

/**
 * Clear the entire cart for the authenticated user.
 */
export async function clearCartAction() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, message: "Unauthorized" };
  }

  const currentUser = await getOrCreateUser(clerkId);
  await clearCartForUser(currentUser.id);

  revalidatePath("/cart");
  return { success: true };
}
