// app/restaurant/dashboard/page.tsx
import { db } from "@/db";
import { users, restaurants, dishes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function RestaurantDashboard() {
  // 1. Authentication Check
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    redirect("/sign-in");
  }

  // 2. Fetch Restaurant owned by the current user
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

  // If the user does not own a restaurant, show a prompt or registration notice
  if (myRestaurants.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Restaurant Found
          </h1>
          <p className="text-gray-500 mb-6">
            Your account is not registered as a restaurant partner yet.
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

  // 3. Fetch Dishes belonging to this restaurant
  const restaurantDishes = await db
    .select()
    .from(dishes)
    .where(eq(dishes.restaurantId, restaurant.id));

  // 4. UI Rendering
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Info */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
              Restaurant Dashboard
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
              {restaurant.name}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Address: {restaurant.houseNumber} {restaurant.street},{" "}
              {restaurant.ward}, {restaurant.province}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/restaurant/dishes/new"
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-rose-500/20"
            >
              + Add New Dish
            </Link>
          </div>
          <Link
            href="/restaurant/orders"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-orange-500/20"
          >
            📦 View Orders
          </Link>
        </div>

        {/* Menu Management Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4">
            Menu Management ({restaurantDishes.length} dishes)
          </h2>

          {restaurantDishes.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              Your menu is currently empty. Add your first dish!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurantDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="border border-gray-100 bg-gray-50/50 p-5 rounded-xl flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {dish.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {dish.description || "No description provided."}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200/60 flex justify-between items-center">
                    <span className="font-extrabold text-rose-600">
                      {Number(dish.price).toLocaleString("en-US")} VND
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2.5 py-1 rounded-lg">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
