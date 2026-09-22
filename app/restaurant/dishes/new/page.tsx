// app/restaurant/dishes/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { message } from "antd";
import { useTranslations } from "next-intl";

interface Category {
  id: string;
  name: string;
}

export default function AddDishPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const t = useTranslations("AddDish");
  const tCommon = useTranslations("Common");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/restaurant/categories");
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.categories || [];
        setCategories(list);
        if (list.length > 0) {
          setCategoryId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !price || !categoryId || !status || stock === "") {
      messageApi.warning(t("fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/restaurant/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          stock: parseInt(stock, 10),
          categoryId,
          status,
          description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        messageApi.success(t("successMsg"));
        setTimeout(() => {
          router.push("/restaurant/dashboard");
          router.refresh();
        }, 500);
      } else {
        messageApi.error(`${tCommon("errorPrefix")}${data.message}`);
      }
    } catch (error) {
      console.error("Connection error:", error);
      messageApi.error(tCommon("connectionError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      {contextHolder}
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-950">🍽️ {t("title")}</h1>
          <Link
            href="/restaurant/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900 font-medium"
          >
            ← {t("back")}
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("nameLabel")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("categoryLabel")} <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900 bg-white"
            >
              {categories.length === 0 ? (
                <option value="">{t("loadingCategories")}</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("priceLabel")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t("pricePlaceholder")}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("stockLabel")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder={t("stockPlaceholder")}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("statusLabel")} <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900 bg-white"
            >
              <option value="active">🟢 Active (Đang bán)</option>
              <option value="pre_order">⏳ Pre-order (Đặt trước)</option>
              <option value="inactive">🔴 Inactive (Tạm ngưng)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("descLabel")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descPlaceholder")}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none h-24 resize-none text-gray-900"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-rose-500/20 cursor-pointer ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            {isSubmitting ? t("saving") : t("saveBtn")}
          </button>
        </form>
      </div>
    </main>
  );
}
