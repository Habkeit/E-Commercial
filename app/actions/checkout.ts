"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { cartItems, dishes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { getOrCreateUser } from "@/lib/services/user.service";
import {
  validateStock,
  updateStripePriceIds,
} from "@/lib/services/dish.service";
import { createOrderWithItems } from "@/lib/services/order.service";
import {
  ensureStripePriceId,
  createCheckoutSession,
} from "@/lib/services/stripe.service";

export interface CheckoutResult {
  success: boolean;
  message?: string;
  url?: string | null;
}

/**
 * Handle checkout submission with full N+1 query elimination:
 * 1. Bulk stock validation in a single SQL query.
 * 2. Restaurant ID resolution from in-memory bulk dish map (no extra query).
 * 3. Transactional atomic insertion of order + orderItems.
 * 4. Batch update of any lazily provisioned Stripe price IDs.
 * 5. Stripe Checkout Session creation with order metadata.
 */
export async function handleCheckoutAction(
  formData: FormData,
): Promise<CheckoutResult> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return {
      success: false,
      message: "Please sign in to proceed with checkout.",
    };
  }

  const tAction = await getTranslations("Cart");
  const phoneNumber = formData.get("phoneNumber") as string;
  const address = formData.get("address") as string;

  if (!phoneNumber || !address) {
    return {
      success: false,
      message:
        tAction("fillPhoneAndAddress") ||
        "Please fill in both Phone Number and Address!",
    };
  }

  const currentUser = await getOrCreateUser(clerkId);

  // Fetch all cart items with dish info in a single join query
  const cartRows = await db
    .select({
      cartId: cartItems.id,
      quantity: cartItems.quantity,
      note: cartItems.note,
      dishId: dishes.id,
      dishName: dishes.name,
      dishPrice: dishes.price,
      stripePriceId: dishes.stripePriceId,
      restaurantId: dishes.restaurantId,
    })
    .from(cartItems)
    .innerJoin(dishes, eq(cartItems.dishId, dishes.id))
    .where(eq(cartItems.userId, currentUser.id))
    .orderBy(cartItems.createdAt);

  if (cartRows.length === 0) {
    return {
      success: false,
      message: tAction("emptyCart") || "Your cart is empty.",
    };
  }

  // 1. Bulk stock validation — single SQL query (O(1) in-memory check, fixes N+1)
  const stockError = await validateStock(
    cartRows.map((item) => ({
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

  // 2. Identify restaurant ID from the first dish in cart
  const restaurantId = cartRows[0].restaurantId;
  if (!restaurantId) {
    return {
      success: false,
      message: "Cannot determine restaurant for this order.",
    };
  }

  const totalAmount = cartRows.reduce(
    (sum, item) => sum + Number(item.dishPrice) * item.quantity,
    0,
  );

  // 3. Atomically create Order and OrderItems in a single DB transaction (fixes N+1 inserts)
  const newOrderId = await createOrderWithItems(
    currentUser.id,
    restaurantId,
    totalAmount,
    `${address} - Phone: ${phoneNumber}`,
    cartRows.map((item) => ({
      dishId: item.dishId,
      quantity: item.quantity,
      price: item.dishPrice,
      note: item.note,
    })),
  );

  // 4. Ensure Stripe Price IDs (lazy provisioning with batch update)
  const priceUpdates: Array<{ dishId: string; stripePriceId: string }> = [];
  const stripeLineItems: Array<{ price: string; quantity: number }> = [];

  for (const item of cartRows) {
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

  // Batch update DB with any newly created Stripe Price IDs
  if (priceUpdates.length > 0) {
    await updateStripePriceIds(priceUpdates);
  }

  // 5. Generate Stripe Checkout Session
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const session = await createCheckoutSession({
    lineItems: stripeLineItems,
    orderId: newOrderId,
    userId: currentUser.id,
    successUrl: `${baseUrl}/orders?success=true`,
    cancelUrl: `${baseUrl}/cart?canceled=true`,
  });

  return { success: true, url: session.url };
}
