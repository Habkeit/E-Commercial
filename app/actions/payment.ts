"use server";

import { getOrderItemsWithDishes } from "@/lib/services/order.service";
import {
  ensureStripePriceId,
  createCheckoutSession,
} from "@/lib/services/stripe.service";
import { updateStripePriceIds } from "@/lib/services/dish.service";

export async function retryCheckoutAction(orderId: string, userId: string) {
  try {
    const itemsInOrder = await getOrderItemsWithDishes(orderId);

    if (itemsInOrder.length === 0) {
      return {
        success: false,
        message: "Không tìm thấy món ăn trong đơn hàng.",
      };
    }

    const priceUpdates: Array<{ dishId: string; stripePriceId: string }> = [];
    const stripeLineItems: Array<{ price: string; quantity: number }> = [];

    for (const item of itemsInOrder) {
      let priceId = item.stripePriceId;

      if (!priceId) {
        priceId = await ensureStripePriceId(
          null,
          item.dishName,
          Number(item.dishPrice),
        );
        priceUpdates.push({ dishId: item.dishId, stripePriceId: priceId });
      }

      stripeLineItems.push({
        price: priceId,
        quantity: item.quantity,
      });
    }

    if (priceUpdates.length > 0) {
      await updateStripePriceIds(priceUpdates);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const session = await createCheckoutSession({
      lineItems: stripeLineItems,
      orderId,
      userId,
      successUrl: `${baseUrl}/orders?success=true`,
      cancelUrl: `${baseUrl}/orders?canceled=true`,
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error("Lỗi tạo lại phiên thanh toán:", error);
    return { success: false, message: "Lỗi kết nối thanh toán." };
  }
}