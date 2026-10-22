// app/restaurant/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import DeleteRestaurantModal from "./DeleteRestaurantModal";
import RestaurantEditForm from "./RestaurantEditForm";
import DishEditForm from "./DishEditForm";
import DishCard from "./DishCard";
import {
  getRestaurantByUserId,
  getCategoriesByRestaurantId,
  getDishesByRestaurantId,
} from "@/lib/services/restaurant.service";
import { deleteRestaurantAction } from "@/app/actions/restaurant";
import { APP_ROUTES } from "@/lib/constants";

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
    redirect(APP_ROUTES.SIGN_IN);
  }

  const restaurant = await getRestaurantByUserId(clerkId);

  const t = await getTranslations("RestaurantDashboard");
  const tCommon = await getTranslations("Common");

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t("noRestaurantTitle")}
          </h1>
          <p className="text-gray-500 mb-6">{t("noRestaurantDesc")}</p>
          <Link
            href={APP_ROUTES.HOME}
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {tCommon("backToHome")}
          </Link>
        </div>
      </main>
    );
  }

  const [allCategories, restaurantDishes] = await Promise.all([
    getCategoriesByRestaurantId(restaurant.id),
    getDishesByRestaurantId(restaurant.id),
  ]);

  const deleteAction = deleteRestaurantAction.bind(null, restaurant.id);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
              {t("restaurantDashboard")}
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
              {restaurant.name}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t("address")}: {restaurant.houseNumber} {restaurant.street},{" "}
              {restaurant.ward}, {restaurant.province}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            {!isEditing && (
              <Link
                href="?edit=true"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm flex items-center gap-1.5"
              >
                ✏️ {t("editBtn")}
              </Link>
            )}
            <Link
              href={APP_ROUTES.RESTAURANT_NEW_DISH}
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-rose-500/20"
            >
              {t("addNewDish")}
            </Link>

            <Link
              href={APP_ROUTES.RESTAURANT_NEW_CATEGORY}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-indigo-500/20"
            >
              📑 {t("addCategory")}
            </Link>

            <Link
              href={APP_ROUTES.RESTAURANT_ORDERS}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-orange-500/20"
            >
              📦 {t("restaurantOrders")}
            </Link>

            <DeleteRestaurantModal deleteAction={deleteAction} />
          </div>
        </div>

        {isEditing && (
          <RestaurantEditForm
            restaurant={restaurant}
            labels={{
              editRestaurantInfo: t("editRestaurantInfo"),
              restaurantName: t("restaurantName"),
              houseNumber: t("houseNumber"),
              street: t("street"),
              ward: t("ward"),
              cityProvince: t("cityProvince"),
              saveChanges: t("saveChanges"),
              cancelBtn: t("cancelBtn"),
            }}
          />
        )}

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4">
            {t("menuManagement")} ({restaurantDishes.length} {t("dishesCount")})
          </h2>

          {restaurantDishes.length === 0 ? (
            <p className="text-gray-500 text-center py-6">{t("emptyMenu")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurantDishes.map((dish) => {
                const isEditingThisDish = editDishId === dish.id;

                if (isEditingThisDish) {
                  return (
                    <DishEditForm
                      key={dish.id}
                      dish={dish}
                      categories={allCategories}
                      labels={{
                        dishNameLabel: t("dishNameLabel"),
                        dishPriceLabel: t("dishPriceLabel"),
                        stock: t("stock"),
                        status: t("status"),
                        category: t("category"),
                        selectCategory: t("selectCategory"),
                        dishDescLabel: t("dishDescLabel"),
                        saveChanges: t("saveChanges"),
                        cancelBtn: t("cancelBtn"),
                        activeStatus: t("activeStatus"),
                        preOrderStatus: t("preOrderStatus"),
                        inactiveStatus: t("inactiveStatus"),
                      }}
                    />
                  );
                }

                return (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    labels={{
                      editBtn: t("editBtn"),
                      deleteDishConfirm: t("deleteDishConfirm"),
                      deleteDishTitle: t("deleteDishTitle"),
                      noDescription: t("noDescription"),
                      stock: t("stock"),
                      activeStatus: t("activeStatus"),
                      preOrderStatus: t("preOrderStatus"),
                      inactiveStatus: t("inactiveStatus"),
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
