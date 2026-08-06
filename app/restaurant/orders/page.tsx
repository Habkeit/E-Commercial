// app/restaurant/orders/page.tsx
import { db } from "@/db";
import { users, restaurants, dishes, orderItems, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

type Order = typeof orders.$inferSelect;

export default async function RestaurantOrdersPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    redirect("/sign-in");
  }

  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));
  if (existingUsers.length === 0) {
    redirect("/");
  }
  const currentUser = existingUsers[0];

  const myRestaurants = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.userId, currentUser.id));
  if (myRestaurants.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Restaurant Found
          </h1>
          <p className="text-gray-500 mb-6">
            Your account is not registered as a restaurant partner.
          </p>
          <Link
            href="/"
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }
  const restaurant = myRestaurants[0];

  const restaurantDishes = await db
    .select()
    .from(dishes)
    .where(eq(dishes.restaurantId, restaurant.id));
  const dishIds = restaurantDishes.map((d) => d.id);

  let incomingOrders: Order[] = [];

  if (dishIds.length > 0) {
    const items = await db.select().from(orderItems);
    const relevantItems = items.filter((item) => dishIds.includes(item.dishId));
    const orderIds = Array.from(new Set(relevantItems.map((i) => i.orderId)));

    if (orderIds.length > 0) {
      const allOrders = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt));
      incomingOrders = allOrders.filter((o) => orderIds.includes(o.id));
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
              Partner Orders
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
              Incoming Orders
            </h1>
          </div>
          <Link
            href="/restaurant/dashboard"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {incomingOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-100">
            <p className="text-gray-500 text-lg">No incoming orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-4">
                  <div>
                    <p className="text-xs text-gray-400 font-mono">
                      Order ID: {order.id}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      Time: {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : order.status === "Delivering"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="text-sm space-y-1 text-gray-600">
                  <p>
                    <span className="font-medium text-gray-800">
                      Delivery Address:
                    </span>{" "}
                    {order.deliveryAddress}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">
                      Total Amount:
                    </span>{" "}
                    <span className="font-bold text-rose-600">
                      {Number(order.totalAmount).toLocaleString()} VND
                    </span>
                  </p>
                </div>

                {/* Nút bấm cập nhật trạng thái đơn hàng */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  <form
                    action={async () => {
                      "use server";
                      await db
                        .update(orders)
                        .set({ status: "Delivering", updatedAt: new Date() })
                        .where(eq(orders.id, order.id));

                      revalidatePath("/restaurant/orders");
                    }}
                  >
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                    >
                      Mark as Delivering 🚚
                    </button>
                  </form>

                  <form
                    action={async () => {
                      "use server";
                      await db
                        .update(orders)
                        .set({ status: "Completed", updatedAt: new Date() })
                        .where(eq(orders.id, order.id));

                      revalidatePath("/restaurant/orders");
                    }}
                  >
                    <button
                      type="submit"
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                    >
                      Mark as Completed ✅
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
