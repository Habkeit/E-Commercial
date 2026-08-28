// app/orders/page.tsx
import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type Order = typeof orders.$inferSelect;

export default async function OrdersPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  let myOrders: Order[] = [];

  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (existingUsers.length > 0) {
    const currentUser = existingUsers[0];

    
    myOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.user_id, currentUser.id))
      .orderBy(desc(orders.createdAt));
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          📦 Order History
        </h1>

        {myOrders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
            <p className="text-gray-500 mb-4">You have no orders yet.</p>
            <Link
              href="/foods"
              className="text-rose-500 font-semibold hover:underline"
            >
              Start ordering now!
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <p className="text-sm text-gray-500">
                    Order ID:{" "}
                    <span className="font-mono text-gray-800">
                      {order.id.slice(0, 8)}...
                    </span>
                  </p>
                  <p className="text-gray-600 mt-1">
                    Date: {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    Address: {order.deliveryAddress}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-rose-600">
                    {Number(order.totalAmount).toLocaleString()} VND
                  </p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : order.status === "Delivering"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
