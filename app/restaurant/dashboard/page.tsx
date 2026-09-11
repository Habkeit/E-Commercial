// app/restaurant/dashboard/page.tsx
import { db } from "@/db";
import { users, restaurants, dishes, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { dict } from "@/app/utils/dictionary";
import { revalidatePath } from "next/cache";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";

export default async function RestaurantDashboard({
  searchParams,
}: {
  searchParams:
    | Promise<{ edit?: string; editDish?: string }>
    | { edit?: string; editDish?: string };
}) {
  const resolvedParams = await searchParams;
  const isEditing = resolvedParams?.edit === "true";
  const editDishId = resolvedParams?.editDish;

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

  const cookieStore = await cookies();
  const currentLang = cookieStore.get("NEXT_LOCALE")?.value || "en";
  const t = dict[currentLang as keyof typeof dict];

  if (myRestaurants.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t.noRestaurantTitle}
          </h1>
          <p className="text-gray-500 mb-6">{t.noRestaurantDesc}</p>
          <Link
            href="/"
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {t.backToHome}
          </Link>
        </div>
      </main>
    );
  }

  const restaurant = myRestaurants[0];

  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, restaurant.id));

  async function updateRestaurantInfo(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const houseNumber = formData.get("houseNumber") as string;
    const street = formData.get("street") as string;
    const ward = formData.get("ward") as string;
    const province = formData.get("province") as string;

    if (!name || !houseNumber || !street || !ward || !province) {
      throw new Error("Please fill in all required fields!");
    }

    await db
      .update(restaurants)
      .set({ name, houseNumber, street, ward, province })
      .where(eq(restaurants.id, restaurant.id));

    revalidatePath("/restaurant/dashboard");
    redirect("/restaurant/dashboard");
  }

  async function deleteRestaurant() {
    "use server";

    await db.delete(dishes).where(eq(dishes.restaurantId, restaurant.id));
    await db.delete(restaurants).where(eq(restaurants.id, restaurant.id));

    revalidatePath("/restaurant/dashboard");
    redirect("/");
  }

  async function updateDishInfo(formData: FormData) {
    "use server";

    const dishId = formData.get("dishId") as string;
    const name = formData.get("name") as string;
    const priceStr = formData.get("price") as string;
    const categoryId = formData.get("categoryId") as string;
    const stockStr = formData.get("stock") as string;
    const description = formData.get("description") as string;

    if (!dishId || !name || !priceStr || !categoryId || stockStr === null) {
      throw new Error("Missing required fields");
    }

    const priceNum = Number(priceStr);
    const stockNum = Number(stockStr);

    if (isNaN(priceNum) || priceNum < 0 || !Number.isInteger(priceNum)) {
      throw new Error("Invalid price. VND must be a positive integer.");
    }
    if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      throw new Error("Invalid stock quantity.");
    }

    // Cập nhật món ăn kèm theo số lượng và tự động bật/tắt trạng thái đang bán
    await db
      .update(dishes)
      .set({
        name,
        price: priceStr,
        categoryId,
        stock: stockNum,
        isActive: stockNum > 0, // Nếu stock = 0 thì tự chuyển thành hết hàng (isActive = false)
        description: description || null,
      })
      .where(eq(dishes.id, dishId));

    revalidatePath("/restaurant/dashboard");
    redirect("/restaurant/dashboard");
  }

  async function deleteDish(formData: FormData) {
    "use server";

    const dishId = formData.get("dishId") as string;
    if (!dishId) return;

    await db.delete(dishes).where(eq(dishes.id, dishId));

    revalidatePath("/restaurant/dashboard");
  }

  const restaurantDishes = await db
    .select()
    .from(dishes)
    .where(eq(dishes.restaurantId, restaurant.id))
    .orderBy(dishes.name);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
              {t.restaurantDashboard}
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
              {restaurant.name}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t.address}: {restaurant.houseNumber} {restaurant.street},{" "}
              {restaurant.ward}, {restaurant.province}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            {!isEditing && (
              <Link
                href="?edit=true"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm flex items-center gap-1.5"
              >
                ✏️ {t.editBtn}
              </Link>
            )}
            <Link
              href="/restaurant/dishes/new"
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-rose-500/20"
            >
              {t.addNewDish}
            </Link>

            <Link
              href="/restaurant/categories/new"
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-indigo-500/20"
            >
              📑 {t.addCategory}
            </Link>

            <Link
              href="/restaurant/orders"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-orange-500/20"
            >
              📦 {t.restaurantOrders}
            </Link>

            <form action={deleteRestaurant}>
              <DeleteConfirmButton
                confirmMessage={
                  currentLang === "vi"
                    ? "Bạn có chắc chắn muốn xóa nhà hàng này cùng toàn bộ menu không?"
                    : "Are you sure you want to delete this restaurant and its menu?"
                }
                className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm border border-red-200 cursor-pointer"
              >
                🗑️ {currentLang === "vi" ? "Xóa quán" : "Delete"}
              </DeleteConfirmButton>
            </form>
          </div>
        </div>

        {isEditing && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-200 space-y-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>

            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {t.editRestaurantInfo}
              </h2>
              <Link
                href="?"
                className="text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full"
              >
                ❌
              </Link>
            </div>

            <form action={updateRestaurantInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.restaurantNameLabel}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={restaurant.name}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.houseNumber} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="houseNumber"
                    defaultValue={restaurant.houseNumber || ""}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.street} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    defaultValue={restaurant.street}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.ward} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ward"
                    defaultValue={restaurant.ward || ""}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.cityProvince} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="province"
                    defaultValue={restaurant.province}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm shadow-sm cursor-pointer"
                >
                  {t.saveChanges}
                </button>
                <Link
                  href="?"
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm shadow-sm flex items-center"
                >
                  {t.cancelBtn}
                </Link>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4">
            {t.menuManagement} ({restaurantDishes.length} {t.dishesCount})
          </h2>

          {restaurantDishes.length === 0 ? (
            <p className="text-gray-500 text-center py-6">{t.emptyMenu}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurantDishes.map((dish) => {
                const isEditingThisDish = editDishId === dish.id;

                if (isEditingThisDish) {
                  return (
                    <div
                      key={dish.id}
                      className="border-2 border-rose-400 bg-rose-50/30 p-5 rounded-xl flex flex-col justify-between shadow-sm animate-in fade-in"
                    >
                      <form action={updateDishInfo} className="space-y-3">
                        <input type="hidden" name="dishId" value={dish.id} />

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            {t.dishNameLabel}{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            defaultValue={dish.name}
                            required
                            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:ring-1 focus:ring-rose-500 bg-white text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            {t.dishPriceLabel}{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="price"
                            defaultValue={dish.price}
                            min="0"
                            step="1"
                            required
                            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:ring-1 focus:ring-rose-500 bg-white text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Stock Quantity{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="stock"
                            defaultValue={dish.stock ?? 0}
                            min="0"
                            step="1"
                            required
                            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:ring-1 focus:ring-rose-500 bg-white text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Category <span className="text-rose-500">*</span>
                          </label>
                          <select
                            name="categoryId"
                            defaultValue={dish.categoryId || ""}
                            required
                            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:ring-1 focus:ring-rose-500 bg-white text-gray-900"
                          >
                            <option value="" disabled>
                              Select a category
                            </option>
                            {allCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            {t.dishDescLabel}
                          </label>
                          <textarea
                            name="description"
                            defaultValue={dish.description || ""}
                            rows={2}
                            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:ring-1 focus:ring-rose-500 bg-white resize-none text-gray-900"
                          ></textarea>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                          >
                            {t.saveChanges}
                          </button>
                          <Link
                            href="?"
                            className="flex-1 bg-white hover:bg-gray-50 border text-center text-gray-700 py-2 rounded-lg text-sm font-semibold transition-colors block"
                          >
                            {t.cancelBtn}
                          </Link>
                        </div>
                      </form>
                    </div>
                  );
                }

                const isOutOfStock = (dish.stock ?? 0) <= 0 || !dish.isActive;

                return (
                  <div
                    key={dish.id}
                    className="border border-gray-100 bg-gray-50/50 p-5 rounded-xl flex flex-col justify-between relative group hover:border-rose-200 transition-colors"
                  >
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full shadow-sm p-1 border border-gray-100">
                      <Link
                        href={`?editDish=${dish.id}`}
                        className="text-gray-400 hover:text-rose-600 p-1 rounded-full transition-colors"
                        title={t.editBtn}
                      >
                        ✏️
                      </Link>

                      <form action={deleteDish}>
                        <input type="hidden" name="dishId" value={dish.id} />
                        <DeleteConfirmButton
                          confirmMessage={
                            currentLang === "vi"
                              ? "Bạn có chắc chắn muốn xóa món này?"
                              : "Are you sure you want to delete this dish?"
                          }
                          className="text-gray-400 hover:text-red-600 p-1 rounded-full transition-colors cursor-pointer"
                          title={
                            currentLang === "vi" ? "Xóa món" : "Delete dish"
                          }
                        >
                          🗑️
                        </DeleteConfirmButton>
                      </form>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 text-lg pr-12">
                        {dish.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {dish.description || t.noDescription}
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200/60 flex justify-between items-center">
                      <span className="font-extrabold text-rose-600">
                        {Number(dish.price).toLocaleString("en-US")} VND
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
                          Stock: {dish.stock ?? 0}
                        </span>
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                            isOutOfStock
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isOutOfStock
                            ? currentLang === "vi"
                              ? "Hết hàng"
                              : "Out of stock"
                            : t.activeStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
