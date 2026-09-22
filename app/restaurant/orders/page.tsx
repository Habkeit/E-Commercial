// app/restaurant/orders/page.tsx
import { db } from "@/db";
import { users, restaurants, orders } from "@/db/schema";
import { eq, desc, or, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getTranslations, getLocale } from "next-intl/server";

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
    .where(
      or(
        eq(restaurants.userId, currentUser.id),
        eq(restaurants.userId, clerkId),
      ),
    );

  const t = await getTranslations("RestaurantOrders");
  const tDashboard = await getTranslations("RestaurantDashboard");
  const tCommon = await getTranslations("Common");
  const tOrders = await getTranslations("Orders");
  const locale = await getLocale();

  if (myRestaurants.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {tDashboard("noRestaurantTitle")}
          </h1>
          <p className="text-gray-500 mb-6">{tDashboard("noRestaurantDesc")}</p>
          <Link
            href="/"
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {tCommon("backToHome")}
          </Link>
        </div>
      </main>
    );
  }

  const restaurantIds = myRestaurants.map((r) => r.id);

  const incomingOrders = await db
    .select()
    .from(orders)
    .where(inArray(orders.restaurantId, restaurantIds))
    .orderBy(desc(orders.createdAt));

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
              {t("partnerOrders")}
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
              {t("incomingOrders")}
            </h1>
          </div>
          <Link
            href="/restaurant/dashboard"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
          >
            {t("backToDashboard")}
          </Link>
        </div>

        {incomingOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-100">
            <p className="text-gray-500 text-lg">{t("noOrders")}</p>
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
                      {t("orderId")} {order.id}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      {t("time")}{" "}
                      {new Date(order.createdAt).toLocaleString(
                        locale === "vi" ? "vi-VN" : "en-US",
                      )}
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
                    {order.status === "Pending" && tOrders("statusPending")}
                    {order.status === "Delivering" &&
                      tOrders("statusDelivering")}
                    {order.status === "Completed" && tOrders("statusCompleted")}
                    {order.status !== "Pending" &&
                      order.status !== "Delivering" &&
                      order.status !== "Completed" &&
                      order.status}
                  </span>
                </div>

                <div className="text-sm space-y-1 text-gray-600">
                  <p>
                    <span className="font-medium text-gray-800">
                      {t("deliveryAddress")}
                    </span>{" "}
                    {order.deliveryAddress}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">
                      {t("totalAmount")}
                    </span>{" "}
                    <span className="font-bold text-rose-600">
                      {Number(order.totalAmount).toLocaleString()} VND
                    </span>
                  </p>
                </div>

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
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                      {t("markDelivering")}
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
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                      {t("markCompleted")}
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
