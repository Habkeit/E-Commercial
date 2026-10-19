// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { findUserByClerkId } from "@/lib/services/user.service";
import { createOrderWithItems } from "@/lib/services/order.service";

interface CartItem {
  dishId: string;
  price: number;
  quantity: number;
  note?: string;
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

    const { cart, deliveryAddress, restaurantId } = await request.json();

    if (!cart || cart.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty" },
        { status: 400 },
      );
    }

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, message: "Restaurant ID is missing" },
        { status: 400 },
      );
    }

    const currentUser = await findUserByClerkId(clerkId);

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Account has not been synchronized with the system.",
        },
        { status: 404 },
      );
    }

    const totalAmount = cart.reduce(
      (total: number, item: CartItem) => total + item.price * item.quantity,
      0,
    );

    const newOrderId = await createOrderWithItems(
      currentUser.id,
      restaurantId,
      totalAmount,
      deliveryAddress,
      cart.map((item: CartItem) => ({
        dishId: item.dishId,
        quantity: item.quantity,
        price: item.price.toString(),
        note: item.note,
      })),
    );

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
      { success: false, message: "Failed to place order" },
      { status: 400 },
    );
  }
}