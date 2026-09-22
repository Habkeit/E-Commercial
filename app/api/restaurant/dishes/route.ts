// app/api/restaurant/dishes/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { restaurants, dishes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { uuidv7 } from "uuidv7";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Đồng bộ cách truy vấn nhà hàng bằng clerkId chuẩn text giống Dashboard
    const myRestaurants = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.userId, clerkId));

    if (myRestaurants.length === 0) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found for this user" },
        { status: 404 },
      );
    }
    const restaurant = myRestaurants[0];

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

    // Validate dữ liệu số bằng Zod tương tự phần update
    const dishValidator = z.object({
      price: z.number().min(0, "Giá tiền không được âm"),
      stock: z
        .number()
        .int("Kho hàng phải là số nguyên")
        .min(0, "Kho hàng không được âm"),
    });

    const parsed = dishValidator.safeParse({ price, stock });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    let finalStatus = status;
    if (parsed.data.stock === 0 && status === "active") {
      finalStatus = "inactive";
    }

    await db.insert(dishes).values({
      id: uuidv7(),
      restaurantId: restaurant.id,
      categoryId,
      name,
      price: parsed.data.price.toString(),
      stock: parsed.data.stock,
      status: finalStatus,
      description: description || null,
    });

    return NextResponse.json({
      success: true,
      message: "Dish added successfully",
    });
  } catch (error) {
    console.error("Error adding dish:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
