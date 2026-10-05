// app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { orders, orderItems, cartItems, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendOrderConfirmation } from "@/app/utils/sendEmail";
import { ORDER_STATUS } from "@/lib/constants";
import { updateOrderStatus } from "@/lib/services/order.service";
import { decrementStockBatch } from "@/lib/services/dish.service";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ WEBHOOK SIGNATURE ERROR:", errorMessage);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const orderId = session.metadata?.orderId;
    const userId = session.metadata?.userId;

    if (orderId && userId) {
      // 1. Update order status to Confirmed
      await updateOrderStatus(orderId, ORDER_STATUS.CONFIRMED);

      // 2. Fetch order items and perform batch inventory decrement (fixes N+1)
      const itemsInOrder = await db
        .select({
          dishId: orderItems.dishId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      await decrementStockBatch(itemsInOrder);

      // 3. Clear customer's shopping cart
      await db.delete(cartItems).where(eq(cartItems.userId, userId));

      // 4. Send email confirmation receipt
      const [orderInfo] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      const [userInfo] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (orderInfo && userInfo) {
        await sendOrderConfirmation(
          userInfo.email,
          userInfo.fullName || "Customer",
          orderId,
          orderInfo.totalAmount.toString(),
          orderInfo.deliveryAddress,
        );
      }

      console.log(
        `✅ Webhook: Order ${orderId} successfully confirmed and inventory deducted.`,
      );

      revalidatePath("/orders");
      revalidatePath("/cart");
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}