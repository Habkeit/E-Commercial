// app/api/cart/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, users, dishes, restaurants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";


export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ success: true, cart: [] });

    
    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });
    if (!userRecord) return NextResponse.json({ success: true, cart: [] });


    const items = await db
      .select({
        dishId: dishes.id,
        name: dishes.name,
        price: dishes.price,
        quantity: cartItems.quantity,
        note: cartItems.note,
        restaurantName: restaurants.name,
      })
      .from(cartItems)
      .innerJoin(dishes, eq(cartItems.dishId, dishes.id))
      .innerJoin(restaurants, eq(dishes.restaurantId, restaurants.id))
      .where(eq(cartItems.userId, userRecord.id));

      
    const formattedCart = items.map((i) => ({
      ...i,
      price: Number(i.price),
    }));

    return NextResponse.json({ success: true, cart: formattedCart });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Error" },
      { status: 500 },
    );
  }
}


export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );

    const { dishId, quantity, note } = await req.json();

    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });
    if (!userRecord)
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );

    
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.userId, userRecord.id),
        eq(cartItems.dishId, dishId),
      ),
    });

    if (existingItem) {
      await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + quantity,
          note: note || existingItem.note,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      await db.insert(cartItems).values({
        userId: userRecord.id,
        dishId,
        quantity,
        note,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Error" },
      { status: 500 },
    );
  }
}
