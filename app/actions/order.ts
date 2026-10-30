"use server";

import { revalidatePath } from "next/cache";
import { updateOrderStatus } from "@/lib/services/order.service";
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

  await updateOrderStatus(orderId, status);

  revalidatePath("/restaurant/orders");
  revalidatePath("/orders");

  return { success: true };
}
