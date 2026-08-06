// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, customers, orders, orderItems } from "@/db/schema";
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
        { success: false, message: "Bạn phải đăng nhập để đặt hàng!" },
        { status: 401 },
      );
    }

    const { cart, deliveryAddress, phoneNumber } = await request.json();

    if (!cart || cart.length === 0) {
      return NextResponse.json(
        { success: false, message: "Giỏ hàng trống" },
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
          message: "Tài khoản chưa được đồng bộ với hệ thống.",
        },
        { status: 404 },
      );
    }

    const currentUser = existingUsers[0];

    
    let dbCustomerId = "";
    const existingCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, currentUser.id));

    if (existingCustomers.length > 0) {
      dbCustomerId = existingCustomers[0].id;
    } else {
      const newCustomerId = randomUUID();
      await db.insert(customers).values({
        id: newCustomerId,
        userId: currentUser.id,
        email: currentUser.email,
        phone: phoneNumber,
      });
      dbCustomerId = newCustomerId;
    }

    
    const totalAmount = cart.reduce(
      (total: number, item: CartItem) => total + item.price * item.quantity,
      0,
    );

    
    const newOrderId = randomUUID();
    await db.insert(orders).values({
      id: newOrderId,
      customerId: dbCustomerId,
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
