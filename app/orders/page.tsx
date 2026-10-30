// app/orders/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import RetryPaymentButton from "./RetryPaymentButton";
import { getOrdersByUserId } from "@/lib/services/order.service";
import { findUserByClerkId } from "@/lib/services/user.service";
import {
  ORDER_STATUS,
  ORDER_STATUS_BADGES,
  APP_ROUTES,
  type OrderStatus,
} from "@/lib/constants";

export default async function OrdersPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect(APP_ROUTES.SIGN_IN);
  }

  const t = await getTranslations("Orders");
  const tCommon = await getTranslations("Common");
  const locale = await getLocale();

  const currentUser = await findUserByClerkId(clerkId);
  const myOrders = currentUser ? await getOrdersByUserId(currentUser.id) : [];

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case ORDER_STATUS.CONFIRMED:
        return t("statusConfirmed") || "Confirmed";
      case ORDER_STATUS.DELIVERING:
        return t("statusDelivering");
      case ORDER_STATUS.COMPLETED:
        return t("statusCompleted");
      case ORDER_STATUS.CANCELED:
        return t("statusCancelled");
      case ORDER_STATUS.PENDING:
      default:
        return t("statusPending");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          📦 {t("orderHistoryTitle")}
        </h1>

        {myOrders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
            <p className="text-gray-500 mb-4">{t("noOrdersText")}</p>
            <Link
              href={APP_ROUTES.FOODS}
              className="text-rose-500 font-semibold hover:underline"
            >
              {t("startOrderingLink")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map((order) => {
              const status = order.status as OrderStatus;
              const badgeStyle =
                ORDER_STATUS_BADGES[status] ||
                ORDER_STATUS_BADGES[ORDER_STATUS.PENDING];
              const statusText = getStatusText(status);

              return (
                <div
                  key={order.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("orderIdLabel")}{" "}
                      <span className="font-mono text-gray-800">
                        {order.id.slice(0, 8)}...
                      </span>
                    </p>
                    <p className="text-gray-600 mt-1">
                      {t("dateLabel")}{" "}
                      {new Date(order.createdAt).toLocaleString(
                        locale === "vi" ? "vi-VN" : "en-US",
                      )}
                    </p>
                    <p className="text-gray-600">
                      {tCommon("address")}: {order.deliveryAddress}
                    </p>
                  </div>

                  <div className="text-right w-full sm:w-auto flex flex-col items-end">
                    <p className="text-xl font-bold text-rose-600">
                      {Number(order.totalAmount).toLocaleString()} VND
                    </p>

                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${badgeStyle.fullClass}`}
                    >
                      {statusText}
                    </span>

                    {status === ORDER_STATUS.PENDING && currentUser && (
                      <RetryPaymentButton
                        orderId={order.id}
                        userId={currentUser.id}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}