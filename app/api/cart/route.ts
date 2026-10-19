// app/api/cart/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, dishes, restaurants } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { uuidv7 } from "uuidv7";
import { getOrCreateUser } from "@/lib/services/user.service";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ success: true, cart: [] });

    const currentUser = await getOrCreateUser(clerkId);

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
      .innerJoin(
        restaurants,
        sql`${dishes.restaurantId}::uuid = ${restaurants.id}`,
      )
      .where(eq(cartItems.userId, currentUser.id));

    const formattedCart = items.map((i) => ({
      ...i,
      price: Number(i.price),
    }));

    return NextResponse.json({ success: true, cart: formattedCart });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve cart" },
      { status: 400 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { dishId, quantity, note } = await req.json();
    const currentUser = await getOrCreateUser(clerkId);

    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.userId, currentUser.id),
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
        id: uuidv7(),
        userId: currentUser.id,
        dishId,
        quantity,
        note,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add item to cart" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const dishId = url.searchParams.get("dishId");

    const currentUser = await getOrCreateUser(clerkId);

    if (dishId) {
      await db
        .delete(cartItems)
        .where(
          and(
            eq(cartItems.userId, currentUser.id),
            eq(cartItems.dishId, dishId),
          ),
        );
    } else {
      await db.delete(cartItems).where(eq(cartItems.userId, currentUser.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete cart error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete item from cart" },
      { status: 400 },
    );
  }
}
