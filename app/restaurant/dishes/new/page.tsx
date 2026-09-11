// app/restaurant/dishes/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { message } from "antd";

interface Category {
  id: string;
  name: string;
}

export default function AddDishPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 👈 Tự động gọi API lấy danh sách Category khi vào trang
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/restaurant/categories");
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    }
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !price || !categoryId) {
      messageApi.warning("Please fill in dish name, price, and category!");
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0 || !Number.isInteger(priceNum)) {
      messageApi.warning("Invalid price. VND must be a positive integer.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/restaurant/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: priceNum,
          categoryId,
          description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        messageApi.success("🎉 Dish added successfully!");
        setTimeout(() => {
          router.push("/restaurant/dashboard");
          router.refresh();
        }, 500);
      } else {
        messageApi.error(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Connection error:", error);
      messageApi.error("Cannot connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      {contextHolder}
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-950">🍽️ Add New Dish</h1>
          <Link
            href="/restaurant/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dish Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Special Broken Rice"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (VND) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 50000"
              min="0"
              step="1"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900 bg-white"
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe ingredients, flavor, etc."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none h-28 resize-none text-gray-900"
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
            {isSubmitting ? "Saving..." : "Save Dish ✨"}
          </button>
        </form>
      </div>
    </main>
  );
}
