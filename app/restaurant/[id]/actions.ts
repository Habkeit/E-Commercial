// app/restaurant/[id]/actions.ts
"use server";

import { db } from "@/db";
import { cartItems, users } from "@/db/schema";
import { auth, currentUser as getClerkUser } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uuidv7 } from "uuidv7";

export async function addToCart(dishId: string) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized");
  }

  // 1. Kiểm tra user đã có trong DB chưa
  let [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  // Nếu chưa có, tự động lấy thông tin từ Clerk và insert vào database luôn
  if (!currentUser) {
    const clerkUser = await getClerkUser();
    const email =
      clerkUser?.emailAddresses[0]?.emailAddress || "no-email@gmail.com";
    const fullName =
      `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
      "User";

    const newUserId = uuidv7();
    await db.insert(users).values({
      id: newUserId,
      clerkId: clerkId,
      email: email,
      fullName: fullName,
    });

    // Lấy lại thông tin user sau khi insert
    [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId));
  }

  // 2. Kiểm tra xem món ăn đã có trong giỏ hàng chưa
  const [existingCartItem] = await db
    .select()
    .from(cartItems)
    .where(
      and(eq(cartItems.userId, currentUser.id), eq(cartItems.dishId, dishId)),
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
      id: uuidv7(),
      userId: currentUser.id,
      dishId: dishId,
      quantity: 1,
    });
  }

  revalidatePath("/cart");
}
