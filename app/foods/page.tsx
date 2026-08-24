import Link from "next/link";
import { db } from "@/db";
import { dishes } from "@/db/schema";
import { ilike } from "drizzle-orm";

interface Restaurant {
  name: string;
}

interface Dish {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  restaurant?: Restaurant | null;
}

// Fetch data directly from DB in Server Component
// -> API
async function getDishes(searchQuery?: string): Promise<Dish[]> {
  try {
    const data = await db.query.dishes.findMany({
      where: searchQuery ? ilike(dishes.name, `%${searchQuery}%`) : undefined,
      with: {
        restaurant: true,
      },
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

  const fetchedDishes = await getDishes(searchQuery);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🔥 Food & Beverage Menu
        </h1>
        <p className="text-gray-600 mb-8">
          Explore delicious dishes from our partner restaurants.
        </p>

        {/* Basic Search Form */}
        <form className="mb-8 flex gap-4 max-w-md">
          <input
            type="text"
            name="query"
            defaultValue={searchQuery}
            placeholder="Search for dishes..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none text-gray-800 placeholder-gray-400"
          />
          <button
            type="submit"
            className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800"
          >
            Search
          </button>
        </form>

        {fetchedDishes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No dishes found matching &quot;{searchQuery}&quot;
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fetchedDishes.map((dish) => (
              <div
                key={dish.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-5 flex flex-col justify-between hover:shadow-lg transition-shadow"
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full">
                    {dish.restaurant?.name || "Restaurant"}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-3">
                    {dish.name}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {dish.description ||
                      "No description available for this dish."}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-lg font-bold text-rose-600">
                    {Number(dish.price).toLocaleString("en-US")} VND
                  </span>
                  <Link
                    href={`/foods/${dish.id}`}
                    className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
