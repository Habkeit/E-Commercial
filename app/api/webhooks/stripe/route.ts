// app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { db } from "@/db";
import { orders, orderItems, dishes, cartItems, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendOrderConfirmation } from "@/app/utils/sendEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
});

export async function POST(req: Request) {
  const body = await req.text();
  
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook signature verification failed:", errorMessage);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const orderId = session.metadata?.orderId;
    const userId = session.metadata?.userId;

    if (orderId && userId) {
      await db
        .update(orders)
        .set({ 
          status: "Confirmed",
          updatedAt: new Date() 
        }) 
        .where(eq(orders.id, orderId));

      const itemsInOrder = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of itemsInOrder) {
        const [currentDish] = await db
          .select()
          .from(dishes)
          .where(eq(dishes.id, item.dishId));

        if (currentDish) {
          const newStock = currentDish.stock - item.quantity;
          await db
            .update(dishes)
            .set({ stock: newStock, isActive: newStock > 0 })
            .where(eq(dishes.id, item.dishId));
        }
      }

      await db.delete(cartItems).where(eq(cartItems.userId, userId));

      const [orderInfo] = await db.select().from(orders).where(eq(orders.id, orderId));
      const [userInfo] = await db.select().from(users).where(eq(users.id, userId));

      if (orderInfo && userInfo) {
        await sendOrderConfirmation(
          userInfo.email,
          userInfo.fullName || "Khách hàng",
          orderId,
          orderInfo.totalAmount.toString(),
          orderInfo.deliveryAddress
        );
      }

      console.log(`✅ Webhook: Đơn hàng ${orderId} đã xử lý xong (Trạng thái Confirmed, Kho, Giỏ hàng, Email)!`);

      revalidatePath("/orders"); 
      revalidatePath("/cart");
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}