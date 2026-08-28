// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";

interface CartItem {
  dishId: string;
  price: number;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        {
          success: false,
          message: "You have to be logged in to place an order!",
        },
        { status: 401 },
      );
    }

    const { cart, deliveryAddress, phoneNumber } = await request.json();

    if (!cart || cart.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty" },
        { status: 400 },
      );
    }

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId));

    if (existingUsers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Account has not been synchronized with the system.",
        },
        { status: 404 },
      );
    }

    const currentUser = existingUsers[0];

    const totalAmount = cart.reduce(
      (total: number, item: CartItem) => total + item.price * item.quantity,
      0,
    );

    const newOrderId = randomUUID();

    await db.insert(orders).values({
      id: newOrderId,
      user_id: currentUser.id,
      totalAmount: totalAmount.toString(),
      deliveryAddress,
      phoneNumber,
      status: "Pending",
    });

    const orderItemsData = cart.map((item: CartItem) => ({
      id: randomUUID(),
      orderId: newOrderId,
      dishId: item.dishId,
      quantity: item.quantity,
      price: item.price.toString(),
    }));

    await db.insert(orderItems).values(orderItemsData);

    return NextResponse.json(
      {
        success: true,
        orderId: newOrderId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
