// app/restaurant/[id]/page.tsx
import { db } from "@/db";
import { restaurants, dishes, categories } from "@/db/schema";
import { eq, asc, and, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { dict } from "@/app/utils/dictionary";
import CategoryDishList from "./CategoryDishList"; 

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

  const restaurantCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, id))
    .orderBy(asc(categories.sortOrder));

  const restaurantDishes = await db
    .select()
    .from(dishes)
    .where(
      and(
        eq(dishes.restaurantId, id),
        or(eq(dishes.status, "active"), eq(dishes.status, "pre_order")),
      ),
    );

  const cookieStore = await cookies();
  const currentLang = cookieStore.get("NEXT_LOCALE")?.value || "en";
  const t = dict[currentLang as keyof typeof dict];

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Link
            href="/foods"
            className="text-rose-600 font-medium hover:underline flex items-center gap-1"
          >
            ← {t.backToMenu || "Back to Menu"}
          </Link>
          <div className="flex gap-3">
            <Link
              href="/cart"
              className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 transition-all shadow-sm flex items-center gap-2"
            >
              <span>🛒</span> {t.cart || "Cart"}
            </Link>
            <Link
              href="/orders"
              className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-sm"
            >
              📦 {t.orders || "Orders"}
            </Link>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {restaurant.name}
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <span>📍</span> {restaurant.houseNumber} {restaurant.street},{" "}
            {restaurant.ward}, {restaurant.province}
          </p>
          {restaurant.note && (
            <div className="inline-block bg-rose-50 text-rose-600 text-sm font-medium px-3 py-1 rounded-full">
              💡 {restaurant.note}
            </div>
          )}
        </div>

        <div className="space-y-10">
          {restaurantCategories.length === 0 ? (
            <p className="text-center text-gray-500 bg-white p-8 rounded-2xl border border-gray-100">
              This restaurant has no categories or dishes available at the
              moment. Please check back later!
            </p>
          ) : (
            restaurantCategories.map((category) => {
              const dishesInCategory = restaurantDishes.filter(
                (dish) => dish.categoryId === category.id,
              );

              if (dishesInCategory.length === 0) return null;

              return (
                <div key={category.id} className="space-y-4">
                  <div className="border-b border-gray-200 pb-2">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-sm text-gray-500">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Truyền riêng danh sách món của danh mục này vào để phân trang độc lập */}
                  <CategoryDishList dishes={dishesInCategory} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}