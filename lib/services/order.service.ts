// lib/services/order.service.ts
/**
 * Order data access and business logic.
 */
import { db } from "@/db";
import { orders, orderItems, dishes } from "@/db/schema";
import { eq, desc, inArray, and } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { ORDER_STATUS, type OrderStatus } from "@/lib/constants";

export type OrderRecord = typeof orders.$inferSelect;
export type DrizzleExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Fetch a single order by its ID.
 */
export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  return order ?? null;
}

/**
 * Fetch a single order by its ID and verify ownership by user ID.
 */
export async function getOrderByIdAndUserId(
  orderId: string,
  userId: string,
): Promise<OrderRecord | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

  return order ?? null;
}

/**
 * Create a new order and its line items atomically.
 * Orders always start in PENDING status — inventory is NOT deducted here.
 * Stock is only decremented later by the Stripe webhook upon confirmed payment.
 */
export async function createOrderWithItems(
  userId: string,
  restaurantId: string,
  totalAmount: number,
  deliveryAddress: string,
  items: Array<{
    dishId: string;
    quantity: number;
    price: string;
    note?: string | null;
  }>,
): Promise<string> {
  const newOrderId = uuidv7();

  await db.transaction(async (tx) => {
    await tx.insert(orders).values({
      id: newOrderId,
      userId,
      restaurantId,
      totalAmount: totalAmount.toString(),
      deliveryAddress,
      status: ORDER_STATUS.PENDING,
    });

    const orderItemsData = items.map((item) => ({
      id: uuidv7(),
      orderId: newOrderId,
      dishId: item.dishId,
      quantity: item.quantity,
      price: item.price,
      note: item.note ?? undefined,
    }));

    if (orderItemsData.length > 0) {
      await tx.insert(orderItems).values(orderItemsData);
    }
  });

  return newOrderId;
}

/**
 * Update the status of an order. Supports passing an optional transaction executor.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  txOrDb: DrizzleExecutor = db,
): Promise<void> {
  await txOrDb
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

/**
 * Atomically update order status only if it is currently in PENDING state.
 * Returns true if the order status was updated, or false if it was already confirmed/canceled.
 * This guarantees strict idempotency during webhook re-deliveries.
 */
export async function updateOrderStatusIfPending(
  orderId: string,
  newStatus: OrderStatus,
  txOrDb: DrizzleExecutor = db,
): Promise<boolean> {
  const result = await txOrDb
    .update(orders)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, ORDER_STATUS.PENDING)))
    .returning({ id: orders.id });

  return result.length > 0;
}

/**
 * Fetch all order items for a given order, joined with dish data.
 * Used by the payment retry flow.
 */
export async function getOrderItemsWithDishes(orderId: string) {
  return db
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
}

/**
 * Fetch all orders for a given user, ordered by creation date descending.
 */
export async function getOrdersByUserId(userId: string) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

/**
 * Fetch incoming orders for one or more restaurants, ordered by creation date descending.
 */
export async function getIncomingOrdersForRestaurants(restaurantIds: string[]) {
  if (restaurantIds.length === 0) return [];
  return db
    .select()
    .from(orders)
    .where(inArray(orders.restaurantId, restaurantIds))
    .orderBy(desc(orders.createdAt));
}
