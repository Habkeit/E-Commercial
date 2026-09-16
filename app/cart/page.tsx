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
import CheckoutForm from "./CheckoutForm";

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
    .where(eq(cartItems.userId, currentUser.id))
    .orderBy(cartItems.createdAt);

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.dishPrice) * item.quantity,
    0,
  );

  async function updateItemQuantity(formData: FormData) {
    "use server";

    const cartId = formData.get("cartId") as string;
    const action = formData.get("action") as string; // "increase", "decrease", hoặc "remove"

    const [item] = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, cartId));

    if (!item) return;

    if (action === "remove") {
      await db.delete(cartItems).where(eq(cartItems.id, cartId));
    } else if (action === "increase") {
      await db
        .update(cartItems)
        .set({ quantity: item.quantity + 1 })
        .where(eq(cartItems.id, cartId));
    } else if (action === "decrease") {
      if (item.quantity > 1) {
        await db
          .update(cartItems)
          .set({ quantity: item.quantity - 1 })
          .where(eq(cartItems.id, cartId));
      } else {
        await db.delete(cartItems).where(eq(cartItems.id, cartId));
      }
    }

    revalidatePath("/cart");
  }

  async function handleCheckout(formData: FormData) {
    "use server";

    const phoneNumber = formData.get("phoneNumber") as string;
    const address = formData.get("address") as string;

    if (!phoneNumber || !address) {
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
        message:
          currentLang === "vi" ? "Giỏ hàng đang trống!" : "Your cart is empty!",
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
    }

    const newOrderId = uuidv7();

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

      const [dishToUpdate] = await db
        .select()
        .from(dishes)
        .where(eq(dishes.id, item.dishId));
      const newStock = dishToUpdate.stock - item.quantity;
      await db
        .update(dishes)
        .set({ stock: newStock, isActive: newStock > 0 })
        .where(eq(dishes.id, item.dishId));
    }

    await db.delete(cartItems).where(eq(cartItems.userId, currentUser.id));

    revalidatePath("/cart");
    revalidatePath("/orders");
    revalidatePath("/restaurant/[id]", "page");

    redirect("/orders");
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🛒 {t.emptyCart}
          </h2>
          <p className="text-gray-500 mb-6 text-sm">{t.emptyCartDesc}</p>
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
                    <form
                      action={updateItemQuantity}
                      className="flex items-center bg-gray-100 rounded-lg p-1"
                    >
                      <input type="hidden" name="cartId" value={item.cartId} />

                      <button
                        type="submit"
                        name="action"
                        value="decrease"
                        className="w-8 h-8 flex items-center justify-center bg-white text-gray-600 rounded shadow-sm hover:bg-gray-50 transition-colors font-bold cursor-pointer"
                      >
                        -
                      </button>

                      <span className="w-10 text-center font-semibold text-sm text-gray-900">
                        {item.quantity}
                      </span>

                      <button
                        type="submit"
                        name="action"
                        value="increase"
                        className="w-8 h-8 flex items-center justify-center bg-white text-gray-600 rounded shadow-sm hover:bg-gray-50 transition-colors font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </form>

                    <form action={updateItemQuantity}>
                      <input type="hidden" name="cartId" value={item.cartId} />
                      <button
                        type="submit"
                        name="action"
                        value="remove"
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </form>

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

        {/* Delivery Info & Checkout Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4">
            {t.deliveryInfo}
          </h2>

          {/* Sử dụng CheckoutForm để hiển thị toast message chuẩn xác */}
          <CheckoutForm
            handleCheckout={handleCheckout}
            defaultPhone={defaultPhone}
            totalAmount={totalAmount}
            t={t}
          />
        </div>
      </div>
    </main>
  );
}
