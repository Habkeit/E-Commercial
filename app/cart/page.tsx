// app/cart/page.tsx
import { db } from "@/db";
import { cartItems, dishes, users, orders, orderItems } from "@/db/schema";
import { auth, currentUser as getClerkUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { uuidv7 } from "uuidv7";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { dict } from "@/app/utils/dictionary";

export default async function CartPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  const clerkUser = await getClerkUser();
  const defaultPhone = clerkUser?.phoneNumbers?.[0]?.phoneNumber || "";

  let [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (!currentUser) {
    const email =
      clerkUser?.emailAddresses[0]?.emailAddress || "no-email@gmail.com";
    const fullName =
      `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
      "User";

    const newUserId = uuidv7();
    await db.insert(users).values({
      id: newUserId,
      clerkId: clerkId,
      email: email,
      fullName: fullName,
    });

    [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId));
  }

  const cookieStore = await cookies();
  const currentLang = cookieStore.get("NEXT_LOCALE")?.value || "en";
  const t = dict[currentLang as keyof typeof dict];

  
  const items = await db
    .select({
      cartId: cartItems.id,
      quantity: cartItems.quantity,
      note: cartItems.note,
      dishId: dishes.id,
      dishName: dishes.name,
      dishPrice: dishes.price,
    })
    .from(cartItems)
    .innerJoin(dishes, eq(cartItems.dishId, dishes.id))
    .where(eq(cartItems.userId, currentUser.id));

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.dishPrice) * item.quantity,
    0,
  );

  
  async function handleCheckout(formData: FormData) {
    "use server";

    const phoneNumber = formData.get("phoneNumber") as string;
    const address = formData.get("address") as string;

    if (!phoneNumber || !address) {
<<<<<<< Updated upstream
      throw new Error("Please fill in both Delivery Address and Phone Number!");
    }

    if (items.length === 0) {
      throw new Error("Cart is empty!");
=======
      return {
        success: false,
        message:
          currentLang === "vi"
            ? "Vui lòng điền đủ Số điện thoại và Địa chỉ!"
            : "Please fill in both Phone Number and Address!",
      };
    }

    if (items.length === 0) {
      return {
        success: false,
        message: currentLang === "vi" ? "Giỏ hàng đang trống!" : "Your cart is empty!",
      };
    }

    for (const item of items) {
      const [currentDish] = await db
        .select()
        .from(dishes)
        .where(eq(dishes.id, item.dishId));

      if (!currentDish) {
        return {
          success: false,
          message:
            currentLang === "vi"
              ? `Món "${item.dishName}" không còn tồn tại trên hệ thống.`
              : `Dish "${item.dishName}" no longer exists on the system.`,
        };
      }

      if (currentDish.stock < item.quantity) {
        return {
          success: false,
          message:
            currentLang === "vi"
              ? `Rất tiếc! Món "${item.dishName}" chỉ còn ${currentDish.stock} phần. Vui lòng giảm số lượng.`
              : `Sorry! Dish "${item.dishName}" only has ${currentDish.stock} left. Please reduce the quantity.`,
        };
      }
>>>>>>> Stashed changes
    }

    const newOrderId = uuidv7();

    // 1. Tạo đơn hàng mới
    await db.insert(orders).values({
      id: newOrderId,
      userId: currentUser.id,
      totalAmount: totalAmount.toString(),
      deliveryAddress: `${address} - Phone: ${phoneNumber}`,
      status: "Pending",
    });

  
    for (const item of items) {
      await db.insert(orderItems).values({
        id: uuidv7(),
        orderId: newOrderId,
        dishId: item.dishId,
        quantity: item.quantity,
        price: item.dishPrice,
        note: item.note,
      });
    }

    
    await db.delete(cartItems).where(eq(cartItems.userId, currentUser.id));

    revalidatePath("/cart");
    revalidatePath("/orders");
    redirect("/orders");
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🛒 {t.emptyCart}
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            {t.emptyCartDesc}
          </p>
          <Link
            href="/foods"
            className="inline-block bg-rose-500 hover:bg-rose-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            {t.exploreMenu}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items Section */}
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🛒 {t.ShoppingCart}
          </h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.cartId}
                  className="py-4 flex justify-between items-center gap-4"
                >
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {item.dishName}
                    </h3>
                    <p className="text-rose-600 font-semibold mt-1">
                      {Number(item.dishPrice).toLocaleString("en-US")} VND
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm">
                      Qty: {item.quantity}
                    </span>

                    <div className="text-right min-w-[90px]">
                      <span className="font-bold text-gray-900 block mb-1">
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

        {/* Delivery Info & Checkout Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4">
            {t.deliveryInfo}
          </h2>

          <form action={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.phone} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phoneNumber"
                required
                defaultValue={defaultPhone} // 👈 Đã thêm defaultValue tự động điền số điện thoại
                placeholder="e.g., 0987654321"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-800 placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t.phoneNote}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.DeliveryAddress} <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                required
                placeholder={t.addressPlaceholder}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none h-24 resize-none text-gray-800 placeholder-gray-400"
              ></textarea>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <span className="text-gray-500">{t.totalPayment}:</span>
              <span className="text-2xl font-extrabold text-rose-600">
                {totalAmount.toLocaleString("en-US")} VND
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-rose-500/20"
            >
              {t.confirmOrder}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
