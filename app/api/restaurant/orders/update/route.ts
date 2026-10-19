// app/api/restaurant/orders/update/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateOrderStatus } from "@/lib/services/order.service";
import { ORDER_STATUS, type OrderStatus } from "@/lib/constants";

export async function PATCH(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, message: "Missing orderId or status" },
        { status: 400 },
      );
    }

    const validStatuses = Object.values(ORDER_STATUS) as string[];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid order status: ${status}` },
        { status: 400 },
      );
    }

    await updateOrderStatus(orderId, status as OrderStatus);

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update order status" },
      { status: 400 },
    );
  }
}