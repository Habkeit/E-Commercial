// app/restaurant/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { message } from "antd";
import { useLanguageStore } from "@/app/store/languageStore";
import { dict } from "@/app/utils/dictionary";

export default function RegisterRestaurantPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [name, setName] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [ward, setWard] = useState("");
  const [province, setProvince] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lang = useLanguageStore((state) => state.lang);
  const t = dict[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !houseNumber || !street || !ward || !province) {
      messageApi.warning(t.fillRequiredFields);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/restaurant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          houseNumber,
          street,
          ward,
          province,
        }),
      });

      const data = await response.json();

      if (data.success) {
        messageApi.success(t.registerSuccess);
        setTimeout(() => {
          router.push("/restaurant/dashboard");
          router.refresh();
        }, 500);
      } else {
        messageApi.error(`${t.errorPrefix}${data.message}`);
      }
    } catch (error) {
      console.error("Connection error:", error);
      messageApi.error(t.connectionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      {contextHolder}{" "}
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold">
              {t.partnerProgram}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {t.registerRestaurant}
            </h1>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 font-medium"
          >
            ← {t.backToHome}
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.restaurantName} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.restaurantNamePlaceholder}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.houseNumber} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder={t.houseNumberPlaceholder}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.street} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder={t.streetPlaceholder}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.ward} <span className="text-rose-500">*</span>{" "}
                {/* 👈 Thêm sao đỏ */}
              </label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder={t.wardPlaceholder}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.cityProvince} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder={t.cityProvincePlaceholder}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-rose-500/20 ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            {isSubmitting ? t.registering : t.completeRegistration}
          </button>
        </form>
      </div>
    </main>
  );
}
