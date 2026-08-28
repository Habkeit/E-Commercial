// app/foods/page.tsx
import Link from "next/link";
import { db } from "@/db";
import { restaurants } from "@/db/schema";
import { ilike } from "drizzle-orm";

interface Restaurant {
  id: string;
  name: string;
  houseNumber: string;
  street: string;
  ward: string;
  province: string;
  note: string | null;
}

// Lấy danh sách nhà hàng trực tiếp từ DB, hỗ trợ tìm kiếm theo tên nhà hàng
async function getRestaurants(searchQuery?: string): Promise<Restaurant[]> {
  try {
    const data = await db.query.restaurants.findMany({
      where: searchQuery ? ilike(restaurants.name, `%${searchQuery}%`) : undefined,
    });
    return data;
  } catch (error) {
    console.error("Database query failed:", error);
    return [];
  }
}

export default async function FoodsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }> | { query?: string };
}) {
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.query || "";

  const fetchedRestaurants = await getRestaurants(searchQuery);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🏪 Partner Restaurants
            </h1>
            <p className="text-gray-600">
              Select a restaurant to explore their delicious menu and dishes.
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl text-sm transition-all shadow-sm"
          >
            <span>📦</span>
            <span>View Order History</span>
          </Link>
        </div>

        {/* Search Form */}
        <form className="mb-8 flex gap-4 max-w-md">
          <input
            type="text"
            name="query"
            defaultValue={searchQuery}
            placeholder="Search for restaurants..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none text-gray-800 placeholder-gray-400 bg-white"
          />
          <button
            type="submit"
            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Search
          </button>
        </form>

        {fetchedRestaurants.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
            No restaurants found matching &quot;{searchQuery}&quot;
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fetchedRestaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/restaurant/${restaurant.id}`}
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md hover:border-rose-500 transition-all group"
              >
                <div>
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-rose-600 transition-colors">
                    {restaurant.name}
                  </h2>
                  <p className="text-gray-500 text-sm mt-2">
                    📍 {restaurant.houseNumber} {restaurant.street}, {restaurant.ward}, {restaurant.province}
                  </p>
                  {restaurant.note && (
                    <span className="inline-block mt-3 text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full">
                      💡 {restaurant.note}
                    </span>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-sm font-semibold text-rose-500 group-hover:underline">
                    View Menu & Dishes →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}