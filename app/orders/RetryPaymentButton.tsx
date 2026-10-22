// app/orders/RetryPaymentButton.tsx
"use client";

import { useState } from "react";
import { retryCheckoutAction } from "@/app/actions/payment";

export default function RetryPaymentButton({ orderId, userId }: { orderId: string, userId: string }) {
  const [loading, setLoading] = useState(false);

  const handleRetryPayment = async () => {
    setLoading(true);
    const res = await retryCheckoutAction(orderId, userId);

    if (res.success && res.url) {
      window.location.href = res.url;
    } else {
      alert("Có lỗi xảy ra: " + res.message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRetryPayment}
      disabled={loading}
      className={`mt-4 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors w-full sm:w-auto shadow-sm ${loading ? "bg-rose-300 cursor-not-allowed" : "bg-rose-500 hover:bg-rose-600"
        }`}
    >
      {loading ? "Đang xử lý..." : "💳 Thanh toán ngay"}
    </button>
  );
}