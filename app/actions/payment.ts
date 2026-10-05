"use server";

import { db } from "@/db";
import { orderItems, dishes, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
});

export async function retryCheckoutAction(orderId: string, userId: string) {
  try {
    const itemsInOrder = await db
      .select({
        dishName: dishes.name,
        dishPrice: orderItems.price,
        quantity: orderItems.quantity,
        stripePriceId: dishes.stripePriceId,
        dishId: dishes.id,
      })
      .from(orderItems)
      .innerJoin(dishes, eq(orderItems.dishId, dishes.id))
      .where(eq(orderItems.orderId, orderId));

    if (itemsInOrder.length === 0) {
      return { success: false, message: "Không tìm thấy món ăn trong đơn hàng." };
    }

    const stripeLineItems = [];

    for (const item of itemsInOrder) {
      let priceId = item.stripePriceId;

      if (!priceId) {
        const stripeProduct = await stripe.products.create({ name: item.dishName });
        const stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          currency: "vnd",
          unit_amount: Number(item.dishPrice),
        });
        priceId = stripePrice.id;
        
        await db.update(dishes).set({ stripePriceId: priceId }).where(eq(dishes.id, item.dishId));
      }

      stripeLineItems.push({
        price: priceId,
        quantity: item.quantity,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: stripeLineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders?canceled=true`,
      metadata: {
        orderId: orderId,
        userId: userId,   
      },
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error("Lỗi tạo lại phiên thanh toán:", error);
    return { success: false, message: "Lỗi kết nối thanh toán." };
  }
}