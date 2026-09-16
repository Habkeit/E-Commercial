// app/restaurant/[id]/CategoryDishList.tsx
"use client";

import { useState } from "react";
import AddToCartButton from "./AddToCartButton";

interface Dish {
  id: string;
  name: string;
  description: string | null;
  price: string;
  status: string;
  categoryId: string;
}

export default function CategoryDishList({ dishes }: { dishes: Dish[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Tính toán số trang và cắt mảng dữ liệu cho trang hiện tại
  const totalPages = Math.ceil(dishes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDishes = dishes.slice(startIndex, startIndex + itemsPerPage);

  if (dishes.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {currentDishes.map((dish) => (
          <div
            key={dish.id}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-lg font-bold text-gray-900">{dish.name}</h3>
                {dish.status === "pre_order" && (
                  <span className="bg-amber-50 text-amber-600 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    ⏳ Pre-order
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                {dish.description || "Không có mô tả chi tiết."}
              </p>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-50">
              <span className="text-rose-600 font-extrabold text-lg">
                {Number(dish.price).toLocaleString("en-US")} VND
              </span>
              <AddToCartButton dishId={dish.id} />
            </div>
          </div>
        ))}
      </div>

      {/* Hiển thị thanh phân trang nếu danh mục này có số lượng món > 10 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            ← Trước
          </button>
          
          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
            Trang {currentPage} / {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}