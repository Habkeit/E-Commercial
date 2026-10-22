"use server";

import { db } from "@/db";
import { dishes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { DISH_STATUS, type DishStatus } from "@/lib/constants";
import {
  syncDishToStripe,
  archiveStripeProduct,
} from "@/lib/services/stripe.service";
import {
  updateRestaurant,
  deleteRestaurant,
} from "@/lib/services/restaurant.service";

export async function updateRestaurantInfoAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const restaurantId = formData.get("restaurantId") as string;
  const name = formData.get("name") as string;
  const houseNumber = formData.get("houseNumber") as string;
  const street = formData.get("street") as string;
  const ward = formData.get("ward") as string;
  const province = formData.get("province") as string;

  if (!restaurantId || !name || !houseNumber || !street || !ward || !province) {
    throw new Error("Please fill in all required fields!");
  }

  await updateRestaurant(restaurantId, {
    name,
    houseNumber,
    street,
    ward,
    province,
  });

  revalidatePath("/restaurant/dashboard");
  redirect("/restaurant/dashboard");
}

export async function deleteRestaurantAction(restaurantId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: "Unauthorized" };

  const result = await deleteRestaurant(restaurantId);

  if (!result.success) {
    return {
      success: false,
      message: result.error || "Cannot delete restaurant.",
    };
  }

  revalidatePath("/restaurant/dashboard");
  return { success: true };
}

const dishValidator = z.object({
  price: z.coerce
    .number()
    .int("Invalid price. VND must be a positive integer without decimals.")
    .min(0, "Invalid price. Cannot be negative."),
  stock: z.coerce
    .number()
    .int("Stock must be an integer.")
    .min(0, "Stock cannot be negative."),
});

export async function updateDishInfoAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dishId = formData.get("dishId") as string;
  const name = formData.get("name") as string;
  const categoryId = formData.get("categoryId") as string;
  const status = formData.get("status") as DishStatus;
  const description = formData.get("description") as string;

  if (
    !dishId ||
    !name ||
    !categoryId ||
    !status ||
    formData.get("stock") === null ||
    formData.get("price") === null
  ) {
    throw new Error("Missing required fields");
  }

  const parsed = dishValidator.safeParse({
    price: formData.get("price"),
    stock: formData.get("stock"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { price, stock } = parsed.data;

  let finalStatus: DishStatus = status;
  if (stock === 0 && status === DISH_STATUS.ACTIVE) {
    finalStatus = DISH_STATUS.INACTIVE;
  }

  const [existingDish] = await db
    .select()
    .from(dishes)
    .where(eq(dishes.id, dishId));

  if (!existingDish) {
    throw new Error("Dish not found");
  }

  const isActive =
    finalStatus === DISH_STATUS.ACTIVE || finalStatus === DISH_STATUS.PRE_ORDER;

  // Synchronize to Stripe using centralized Stripe service
  const stripePriceId = await syncDishToStripe(
    existingDish.stripePriceId,
    name,
    existingDish.name,
    price,
    Number(existingDish.price),
    isActive,
  );

  await db
    .update(dishes)
    .set({
      name,
      price: price.toString(),
      categoryId,
      stock,
      status: finalStatus,
      description: description || null,
      stripePriceId,
      updatedAt: new Date(),
    })
    .where(eq(dishes.id, dishId));

  revalidatePath("/restaurant/dashboard");
  redirect("/restaurant/dashboard");
}

export async function deleteDishAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return;

  const dishId = formData.get("dishId") as string;
  if (!dishId) return;

  const [dishToDelete] = await db
    .select()
    .from(dishes)
    .where(eq(dishes.id, dishId));

  if (dishToDelete?.stripePriceId) {
    await archiveStripeProduct(dishToDelete.stripePriceId);
  }

  await db.delete(dishes).where(eq(dishes.id, dishId));

  revalidatePath("/restaurant/dashboard");
}
