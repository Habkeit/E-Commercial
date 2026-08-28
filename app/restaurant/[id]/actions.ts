// app/restaurants/[id]/actions.ts
"use server";

import { db } from "@/db";
import { cartItems, users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addToCart(dishId: string) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized");
  }

  // 1. Lấy thông tin user hiện tại từ bảng users dựa vào clerkId
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (!currentUser) {
    throw new Error("User not found in database");
  }

  // 2. Kiểm tra xem món ăn đã có trong giỏ hàng của user này chưa
  const [existingCartItem] = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.userId, currentUser.id),
        eq(cartItems.dishId, dishId)
      )
    );

  if (existingCartItem) {
    await db
      .update(cartItems)
      .set({
        quantity: existingCartItem.quantity + 1,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, existingCartItem.id));
  } else {
    await db.insert(cartItems).values({
      userId: currentUser.id,
      dishId: dishId,
      quantity: 1,
    });
  }

  revalidatePath("/cart");
}