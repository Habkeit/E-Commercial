"use server";

import { revalidatePath } from "next/cache";
import { getOrderById, updateOrderStatus } from "@/lib/services/order.service";
import { getRestaurantByUserId } from "@/lib/services/restaurant.service";
import { ORDER_STATUS, type OrderStatus } from "@/lib/constants";
import { auth } from "@clerk/nextjs/server";

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const validStatuses = Object.values(ORDER_STATUS) as string[];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid order status: ${status}`);
  }

  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  // Verify that the logged-in user owns the restaurant receiving this order
  const restaurant = await getRestaurantByUserId(userId);
  if (!restaurant || restaurant.id !== order.restaurantId) {
    throw new Error("Unauthorized: You do not own the restaurant for this order.");
  }

  await updateOrderStatus(orderId, status);

  revalidatePath("/restaurant/orders");
  revalidatePath("/orders");

  return { success: true };
}
