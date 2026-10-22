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
  ensureStripePriceId,
} from "@/lib/services/stripe.service";
import {
  getRestaurantByUserId,
  getCategoriesByRestaurantId,
  createRestaurant,
  createCategory,
  createDishRecord,
  updateRestaurant,
  deleteRestaurant,
} from "@/lib/services/restaurant.service";
import { getOrCreateUser } from "@/lib/services/user.service";

/**
 * Register a new restaurant for the authenticated user.
 */
export async function registerRestaurantAction(data: {
  name: string;
  houseNumber: string;
  street: string;
  ward: string;
  province: string;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, message: "Unauthorized: Please sign in." };
  }

  const currentUser = await getOrCreateUser(clerkId);
  const existingRestaurant = await getRestaurantByUserId(currentUser.id);
  if (existingRestaurant) {
    return { success: false, message: "You already have a registered restaurant." };
  }

  const newRestaurant = await createRestaurant({
    userId: currentUser.id,
    name: data.name.trim(),
    houseNumber: data.houseNumber.trim(),
    street: data.street.trim(),
    ward: data.ward.trim(),
    province: data.province.trim(),
  });

  revalidatePath("/restaurant/dashboard");
  return { success: true, restaurantId: newRestaurant.id };
}

/**
 * Fetch all categories for the authenticated owner's restaurant.
 */
export async function getCategoriesAction() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: true, categories: [] };
  }

  const restaurant = await getRestaurantByUserId(clerkId);
  if (!restaurant) {
    return { success: true, categories: [] };
  }

  const categories = await getCategoriesByRestaurantId(restaurant.id);
  return { success: true, categories };
}

/**
 * Create a new category for the authenticated owner's restaurant.
 */
export async function createCategoryAction(data: {
  name: string;
  description?: string;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, message: "Unauthorized: Please sign in." };
  }

  const restaurant = await getRestaurantByUserId(clerkId);
  if (!restaurant) {
    return { success: false, message: "Restaurant not found." };
  }

  if (!data.name || !data.name.trim()) {
    return { success: false, message: "Category name is required." };
  }

  const category = await createCategory({
    restaurantId: restaurant.id,
    name: data.name.trim(),
    description: data.description?.trim(),
  });

  revalidatePath("/restaurant/dashboard");
  return { success: true, categoryId: category.id };
}

/**
 * Create a new dish for the authenticated owner's restaurant.
 */
export async function createDishAction(formData: FormData) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, message: "Unauthorized: Please sign in." };
  }

  const restaurant = await getRestaurantByUserId(clerkId);
  if (!restaurant) {
    return { success: false, message: "Restaurant not found." };
  }

  const name = (formData.get("name") as string)?.trim();
  const priceRaw = formData.get("price");
  const stockRaw = formData.get("stock");
  const categoryId = formData.get("categoryId") as string;
  const status = (formData.get("status") as DishStatus) || DISH_STATUS.ACTIVE;
  const description = (formData.get("description") as string)?.trim();

  if (!name || !priceRaw || !stockRaw || !categoryId) {
    return { success: false, message: "Missing required fields." };
  }

  const price = Math.round(Number(priceRaw));
  const stock = Math.round(Number(stockRaw));

  if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
    return { success: false, message: "Price and stock must be positive numbers." };
  }

  // Provision Stripe Price ID
  let stripePriceId: string | null = null;
  try {
    stripePriceId = await ensureStripePriceId(null, name, price);
  } catch (stripeErr) {
    console.warn("Failed to provision Stripe price on dish creation, continuing:", stripeErr);
  }

  await createDishRecord({
    restaurantId: restaurant.id,
    categoryId,
    name,
    price,
    stock,
    status,
    description: description || undefined,
    stripePriceId,
  });

  revalidatePath("/restaurant/dashboard");
  return { success: true };
}

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

  // Verify ownership
  const restaurant = await getRestaurantByUserId(userId);
  if (!restaurant || restaurant.id !== restaurantId) {
    throw new Error("Unauthorized: You do not own this restaurant.");
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

  const restaurant = await getRestaurantByUserId(userId);
  if (!restaurant || restaurant.id !== restaurantId) {
    return { success: false, message: "Unauthorized: You do not own this restaurant." };
  }

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

  const [existingDish] = await db
    .select()
    .from(dishes)
    .where(eq(dishes.id, dishId));

  if (!existingDish) {
    throw new Error("Dish not found");
  }

  // Verify ownership
  const restaurant = await getRestaurantByUserId(userId);
  if (!restaurant || restaurant.id !== existingDish.restaurantId) {
    throw new Error("Unauthorized: You do not own the restaurant for this dish.");
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

  if (!dishToDelete) return;

  // Verify ownership
  const restaurant = await getRestaurantByUserId(userId);
  if (!restaurant || restaurant.id !== dishToDelete.restaurantId) {
    return;
  }

  if (dishToDelete.stripePriceId) {
    await archiveStripeProduct(dishToDelete.stripePriceId);
  }

  await db.delete(dishes).where(eq(dishes.id, dishId));

  revalidatePath("/restaurant/dashboard");
}
