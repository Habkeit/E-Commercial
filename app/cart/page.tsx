// app/cart/page.tsx
import { db } from "@/db";
import { cartItems, dishes } from "@/db/schema";
import { auth, currentUser as getClerkUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import CheckoutForm from "./CheckoutForm";
import CartItemQuantity from "./CartItemQuantity";
import { getOrCreateUser } from "@/lib/services/user.service";
import { handleCheckoutAction } from "@/app/actions/checkout";
import { updateCartItemQuantityAction } from "@/app/actions/cart";
import { APP_ROUTES } from "@/lib/constants";

export default async function CartPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect(APP_ROUTES.SIGN_IN);
  }

  const [clerkUser, currentUser] = await Promise.all([
    getClerkUser(),
    getOrCreateUser(clerkId),
  ]);

  const defaultPhone = clerkUser?.phoneNumbers?.[0]?.phoneNumber || "";
  const t = await getTranslations("Cart");

  const items = await db
    .select({
      cartId: cartItems.id,
      quantity: cartItems.quantity,
      note: cartItems.note,
      dishId: dishes.id,
      dishName: dishes.name,
      dishPrice: dishes.price,
      stripePriceId: dishes.stripePriceId,
    })
    .from(cartItems)
    .innerJoin(dishes, eq(cartItems.dishId, dishes.id))
    .where(eq(cartItems.userId, currentUser.id))
    .orderBy(cartItems.createdAt);

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.dishPrice) * item.quantity,
    0,
  );

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🛒 {t("emptyCart")}
          </h2>
          <p className="text-gray-500 mb-6 text-sm">{t("emptyCartDesc")}</p>
          <Link
            href={APP_ROUTES.FOODS}
            className="inline-block bg-rose-500 hover:bg-rose-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            {t("exploreMenu")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🛒 {t("ShoppingCart")}
          </h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.cartId}
                  className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                      {item.dishName}
                    </h3>
                    <p className="text-rose-600 font-semibold mt-1">
                      {Number(item.dishPrice).toLocaleString("en-US")} VND
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <CartItemQuantity
                      cartId={item.cartId}
                      quantity={item.quantity}
                      updateItemQuantity={updateCartItemQuantityAction}
                    />

                    <div className="text-right min-w-[90px] hidden sm:block">
                      <span className="font-bold text-gray-900 block">
                        {(
                          Number(item.dishPrice) * item.quantity
                        ).toLocaleString("en-US")}{" "}
                        VND
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4">
            {t("deliveryInfo")}
          </h2>

          <CheckoutForm
            handleCheckout={handleCheckoutAction}
            defaultPhone={defaultPhone}
            totalAmount={totalAmount}
          />
        </div>
      </div>
    </main>
  );
}
