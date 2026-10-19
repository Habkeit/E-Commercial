// app/api/restaurant/dishes/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { dishes } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { DISH_STATUS, type DishStatus } from "@/lib/constants";
import { createProductAndPrice } from "@/lib/services/stripe.service";
import { getRestaurantByUserId } from "@/lib/services/restaurant.service";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const restaurant = await getRestaurantByUserId(clerkId);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found for this user" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const { name, price, stock, categoryId, status, description } = body;

    if (
      !name ||
      price === undefined ||
      stock === undefined ||
      !categoryId ||
      !status
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const dishValidator = z.object({
      price: z.number().min(0, "Price cannot be negative"),
      stock: z
        .number()
        .int("Stock must be an integer")
        .min(0, "Stock cannot be negative"),
    });

    const parsed = dishValidator.safeParse({ price, stock });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    let finalStatus: DishStatus = status;
    if (parsed.data.stock === 0 && status === DISH_STATUS.ACTIVE) {
      finalStatus = DISH_STATUS.INACTIVE;
    }

    // Provision Stripe Product & Price via centralized service
    let stripePriceId: string | null = null;
    try {
      const stripeResult = await createProductAndPrice(
        name,
        parsed.data.price,
        { restaurantId: restaurant.id },
      );
      stripePriceId = stripeResult.stripePriceId;
    } catch (stripeError) {
      console.error("Error syncing product to Stripe:", stripeError);
    }

    // Persist to local database
    await db.insert(dishes).values({
      id: uuidv7(),
      restaurantId: restaurant.id,
      categoryId,
      name,
      price: parsed.data.price.toString(),
      stock: parsed.data.stock,
      status: finalStatus,
      description: description || null,
      stripePriceId,
    });

    return NextResponse.json({
      success: true,
      message: "Dish added successfully and synced to Stripe!",
    });
  } catch (error) {
    console.error("Error adding dish:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 400 },
    );
  }
}
