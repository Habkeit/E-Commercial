// app/restaurant/[id]/page.tsx
import { db } from "@/db";
import Link from "next/link";
import { restaurants, dishes, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { addToCart } from "./actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RestaurantDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, id));

  if (!restaurant) {
    notFound();
  }

  const restaurantDishes = await db
    .select({
      id: dishes.id,
      name: dishes.name,
      price: dishes.price,
      description: dishes.description,
      categoryName: categories.name,
    })
    .from(dishes)
    .innerJoin(categories, eq(dishes.categoryId, categories.id))
    .where(eq(dishes.restaurantId, id));

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Link
            href="/foods"
            className="text-rose-500 font-medium hover:underline"
          >
            ← Back to Restaurant List
          </Link>
          <Link
            href="/orders"
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all"
          >
            📦 View Orders
          </Link>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {restaurant.name}
          </h1>
          <p className="text-gray-600">
            📍 {restaurant.houseNumber} {restaurant.street}, {restaurant.ward},{" "}
            {restaurant.province}
          </p>
          {restaurant.note && (
            <p className="text-rose-600 font-medium text-sm bg-rose-50 inline-block px-3 py-1 rounded-full">
              💡 {restaurant.note}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">🍽️ Menu</h2>

          {restaurantDishes.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded-xl border border-gray-100 text-center">
              Not found any dishes for this restaurant.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {restaurantDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow"
                >
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {dish.categoryName}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-2">
                      {dish.name}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {dish.description || "No description available"}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                    <span className="text-rose-600 font-extrabold text-lg">
                      {Number(dish.price).toLocaleString()} VND
                    </span>

                    <form
                      action={async () => {
                        "use server";
                        await addToCart(dish.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
                      >
                        Insert to Cart 🛒
                      </button>
                    </form>
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
