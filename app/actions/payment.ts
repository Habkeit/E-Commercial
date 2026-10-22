"use server";

import { auth } from "@clerk/nextjs/server";
import {
  getOrderById,
  getOrderItemsWithDishes,
} from "@/lib/services/order.service";
import {
  ensureStripePriceId,
  createCheckoutSession,
} from "@/lib/services/stripe.service";
import {
  validateStock,
  updateStripePriceIds,
} from "@/lib/services/dish.service";
import { findUserByClerkId } from "@/lib/services/user.service";
import { ORDER_STATUS } from "@/lib/constants";

export async function retryCheckoutAction(orderId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return {
        success: false,
        message: "Please sign in to retry payment.",
      };
    }

    const currentUser = await findUserByClerkId(clerkId);
    if (!currentUser) {
      return {
        success: false,
        message: "User record not found.",
      };
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return {
        success: false,
        message: "Order not found.",
      };
    }

    // Verify order ownership
    if (order.userId !== currentUser.id && order.userId !== clerkId) {
      return {
        success: false,
        message: "Unauthorized: You do not own this order.",
      };
    }

    // Verify order is still pending
    if (order.status !== ORDER_STATUS.PENDING) {
      return {
        success: false,
        message: `This order cannot be paid again because its status is "${order.status}".`,
      };
    }

    const itemsInOrder = await getOrderItemsWithDishes(orderId);

    if (itemsInOrder.length === 0) {
      return {
        success: false,
        message: "No dishes found in this order.",
      };
    }

    // Re-validate stock before allowing checkout session creation
    const stockError = await validateStock(
      itemsInOrder.map((item) => ({
        dishId: item.dishId,
        dishName: item.dishName,
        quantity: item.quantity,
      })),
    );

    if (stockError) {
      return {
        success: false,
        message: stockError,
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
          Math.round(Number(item.dishPrice)),
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
      userId: currentUser.id,
      successUrl: `${baseUrl}/orders?success=true`,
      cancelUrl: `${baseUrl}/orders?canceled=true`,
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error("Payment retry error:", error);
    return { success: false, message: "Payment service connection error." };
  }
}