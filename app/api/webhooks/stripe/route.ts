// app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { orders, orderItems, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendOrderConfirmation } from "@/app/utils/sendEmail";
import { ORDER_STATUS } from "@/lib/constants";
import { updateOrderStatusIfPending } from "@/lib/services/order.service";
import { decrementStockBatch } from "@/lib/services/dish.service";
import { clearCartForUser } from "@/lib/services/cart.service";

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
      // Execute status update, stock decrement, and cart deletion inside an atomic transaction
      const wasConfirmed = await db.transaction(async (tx) => {
        // Idempotency guard: update only if currently in PENDING state
        const updated = await updateOrderStatusIfPending(
          orderId,
          ORDER_STATUS.CONFIRMED,
          tx,
        );

        if (!updated) {
          // Already processed by earlier webhook delivery
          return false;
        }

        const itemsInOrder = await tx
          .select({
            dishId: orderItems.dishId,
            quantity: orderItems.quantity,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId));

        await decrementStockBatch(itemsInOrder, tx);

        await clearCartForUser(userId, tx);

        return true;
      });

      if (!wasConfirmed) {
        console.log(
          `ℹ️ Webhook: Order ${orderId} was already confirmed. Skipping duplicate deduction.`,
        );
        return NextResponse.json(
          { received: true, note: "Already processed" },
          { status: 200 },
        );
      }

      // Non-blocking asynchronous email receipt dispatch
      (async () => {
        try {
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
        } catch (emailError) {
          console.error("Non-fatal webhook email error:", emailError);
        }
      })();

      console.log(
        `✅ Webhook: Order ${orderId} successfully confirmed and inventory deducted.`,
      );

      revalidatePath("/orders");
      revalidatePath("/cart");
      revalidatePath("/restaurant/orders");
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}