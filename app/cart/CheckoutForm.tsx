// app/cart/CheckoutForm.tsx
"use client";

import { useState } from "react";
import { message } from "antd";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/app/store/cartStore";
import { useRouter } from "next/navigation";

interface CheckoutFormProps {
  handleCheckout: (
    formData: FormData,
  ) => Promise<{ success: boolean; message: string } | void>;
  defaultPhone: string;
  totalAmount: number;
}

export default function CheckoutForm({
  handleCheckout,
  defaultPhone,
  totalAmount,
}: CheckoutFormProps) {
  const t = useTranslations("Cart");
  const [messageApi, contextHolder] = message.useMessage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clearCart = useCartStore((state) => state.clearCart);
  
  const router = useRouter();

  const onSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    const result = await handleCheckout(formData);

    if (result && !result.success) {
      messageApi.error(result.message);
      setIsSubmitting(false);
    } else {
      clearCart();
      router.push("/orders");
      router.refresh();
    }
  };

  return (
    <form action={onSubmit} className="space-y-4">
      {contextHolder}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("phone")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="phoneNumber"
          required
          defaultValue={defaultPhone}
          placeholder="e.g., 0987654321"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-800 placeholder-gray-400"
        />
        <p className="text-xs text-gray-500 mt-1">{t("phoneNote")}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("DeliveryAddress")} <span className="text-red-500">*</span>
        </label>
        <textarea
          name="address"
          required
          placeholder={t("addressPlaceholder")}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none h-24 resize-none text-gray-800 placeholder-gray-400"
        ></textarea>
      </div>

      <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
        <span className="text-gray-500">{t("totalPayment")}:</span>
        <span className="text-2xl font-extrabold text-rose-600">
          {totalAmount.toLocaleString("en-US")} VND
        </span>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full text-white font-semibold py-3 rounded-xl transition-colors shadow-lg cursor-pointer ${
          isSubmitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
        }`}
      >
        {isSubmitting ? t("processing", { fallback: "Đang xử lý..." }) : t("confirmOrder")}
      </button>
    </form>
  );
}