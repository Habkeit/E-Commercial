// app/orders/OrderCard.tsx
"use client";

import { useState } from "react";
import { retryCheckoutAction } from "@/app/actions/payment";
import { InferSelectModel } from "drizzle-orm";
import { orders } from "@/db/schema";
import { ORDER_STATUS } from "@/lib/constants";
import { useTranslations } from "next-intl";
import { message } from "antd";

type Order = InferSelectModel<typeof orders>;

export default function OrderCard({
  order,
}: {
  order: Order;
  userId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const t = useTranslations("Orders");

  const handleRetryPayment = async () => {
    setLoading(true);
    const res = await retryCheckoutAction(order.id);

    if (res.success && res.url) {
      window.location.href = res.url;
    } else {
      messageApi.error(`${t("retryError")}${res.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded-xl bg-white shadow-sm">
      {contextHolder}
      <h3 className="font-bold">
        {t("orderIdLabel")} {order.id}
      </h3>
      <p className="text-gray-600">
        {t("orderStatusLabel")} {order.status}
      </p>

      {order.status === ORDER_STATUS.PENDING && (
        <button
          onClick={handleRetryPayment}
          disabled={loading}
          className={`mt-3 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
            loading
              ? "bg-rose-300 cursor-not-allowed"
              : "bg-rose-500 hover:bg-rose-600"
          }`}
        >
          {loading ? t("retryingPayment") : t("retryPayment")}
        </button>
      )}
    </div>
  );
}
