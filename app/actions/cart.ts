"use server";

import { db } from "@/db";
import { cartItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateCartItemQuantityAction(formData: FormData) {
  const cartId = formData.get("cartId") as string;
  const action = formData.get("action") as string;

  if (!cartId || !action) return;

  const [item] = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.id, cartId));

  if (!item) return;

  if (action === "remove") {
    await db.delete(cartItems).where(eq(cartItems.id, cartId));
  } else if (action === "increase") {
    await db
      .update(cartItems)
      .set({ quantity: item.quantity + 1, updatedAt: new Date() })
      .where(eq(cartItems.id, cartId));
  } else if (action === "decrease") {
    if (item.quantity > 1) {
      await db
        .update(cartItems)
        .set({ quantity: item.quantity - 1, updatedAt: new Date() })
        .where(eq(cartItems.id, cartId));
    } else {
      await db.delete(cartItems).where(eq(cartItems.id, cartId));
    }
  }

  revalidatePath("/cart");
}
