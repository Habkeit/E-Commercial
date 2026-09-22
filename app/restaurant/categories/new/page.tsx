// app/restaurant/categories/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { message } from "antd";
import { useTranslations } from "next-intl";
import { z } from "zod";

export default function CreateCategoryPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const t = useTranslations("CategoryManagement"); 
  const tCommon = useTranslations("Common");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categorySchema = z.object({
    name: z.string().trim().min(1, t("nameRequired")),
    description: z.string().trim().optional(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedData = categorySchema.safeParse({
      name,
      description,
    });

    if (!parsedData.success) {
      const errorMsg = parsedData.error.issues[0].message;
      messageApi.warning(errorMsg);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/restaurant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData.data),
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
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold">
              {t("badge")}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {t("title")}
            </h1>
          </div>
          <Link
            href="/restaurant/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
          >
            ← {t("back")}
          </Link>
        </div>

        {/* Form Section */}
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
              {t("descLabel")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={t("descPlaceholder")}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-rose-500/20 cursor-pointer ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-rose-500 hover:bg-rose-600 active:scale-[0.98]"
            }`}
          >
            {isSubmitting ? t("submitting") : t("submitBtn")}
          </button>
        </form>
      </div>
    </main>
  );
}
