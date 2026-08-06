// app/api/restaurant/dishes/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, restaurants, dishes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { uuidv7 } from "uuidv7";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    
    const existingUsers = await db.select().from(users).where(eq(users.clerkId, clerkId));
    if (existingUsers.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    const currentUser = existingUsers[0];

    const myRestaurants = await db.select().from(restaurants).where(eq(restaurants.userId, currentUser.id));
    if (myRestaurants.length === 0) {
      return NextResponse.json({ success: false, message: "Restaurant not found for this user" }, { status: 404 });
    }
    const restaurant = myRestaurants[0];

    const body = await req.json();
    const { name, price, description } = body;

    if (!name || !price) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    
    await db.insert(dishes).values({
      id: uuidv7(),
      restaurantId: restaurant.id,
      categoryId: uuidv7(),
      name,
      price: price.toString(),
      description: description || "",
    });

    return NextResponse.json({ success: true, message: "Dish added successfully" });
  } catch (error) {
    console.error("Error adding dish:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}