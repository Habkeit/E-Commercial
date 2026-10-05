// app/orders/OrderCard.tsx
"use client";

import { useState } from "react";
import { retryCheckoutAction } from "@/app/actions/payment";
import { InferSelectModel } from "drizzle-orm";
import { orders } from "@/db/schema";

type Order = InferSelectModel<typeof orders>;

export default function OrderCard({ 
  order, 
  userId 
}: { 
  order: Order; 
  userId: string 
}) {
  const [loading, setLoading] = useState(false);

  const handleRetryPayment = async () => {
    setLoading(true);
    const res = await retryCheckoutAction(order.id, userId);

    if (res.success && res.url) {
      window.location.href = res.url;
    } else {
      alert("Có lỗi xảy ra: " + res.message);
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded-xl bg-white shadow-sm">
      <h3 className="font-bold">Mã đơn: {order.id}</h3>
      <p className="text-gray-600">Trạng thái: {order.status}</p>

      {order.status === "Pending" && (
        <button
          onClick={handleRetryPayment}
          disabled={loading}
          className={`mt-3 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
            loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Đang xử lý..." : "Thanh toán ngay"}
        </button>
      )}
    </div>
  );
}
