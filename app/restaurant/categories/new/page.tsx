// app/restaurant/categories/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { message } from "antd";

export default function AddCategoryPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      messageApi.warning("Vui lòng nhập tên danh mục!");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/restaurant/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await response.json();

      if (data.success) {
        messageApi.success("🎉 Tạo danh mục thành công!");
        setTimeout(() => {
          router.push("/restaurant/dashboard");
          router.refresh();
        }, 500);
      } else {
        messageApi.error(`Lỗi: ${data.message}`);
      }
    } catch (error) {
      console.error("Chi tiết lỗi:", error);
      messageApi.error("Không thể kết nối đến server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      {contextHolder}
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-950">
            📑 Thêm Danh Mục Mới
          </h1>
          <Link
            href="/restaurant/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900 font-medium"
          >
            ← Quay lại Dashboard
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên Danh Mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Món Chính, Đồ Uống..."
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none text-gray-900 focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả (Không bắt buộc)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về danh mục này..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none h-28 resize-none text-gray-900 focus:ring-2 focus:ring-rose-500"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
            }`}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu Danh Mục ✨"}
          </button>
        </form>
      </div>
    </main>
  );
}
