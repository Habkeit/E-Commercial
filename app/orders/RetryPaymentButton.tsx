// app/orders/RetryPaymentButton.tsx
"use client";

import { useState } from "react";
import { retryCheckoutAction } from "@/app/actions/payment";
import { useTranslations } from "next-intl";
import { message } from "antd";

export default function RetryPaymentButton({ orderId }: { orderId: string; userId?: string }) {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const t = useTranslations("Orders");

  const handleRetryPayment = async () => {
    setLoading(true);
    const res = await retryCheckoutAction(orderId);

    if (res.success && res.url) {
      window.location.href = res.url;
    } else {
      messageApi.error(`${t("retryError")}${res.message}`);
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <button
        onClick={handleRetryPayment}
        disabled={loading}
        className={`mt-4 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors w-full sm:w-auto shadow-sm ${
          loading ? "bg-rose-300 cursor-not-allowed" : "bg-rose-500 hover:bg-rose-600"
        }`}
      >
        {loading ? t("retryingPayment") : t("retryPayment")}
      </button>
    </>
  );
}