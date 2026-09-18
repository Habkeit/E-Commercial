// app/restaurant/dashboard/DeleteRestaurantModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  deleteAction: () => Promise<{ success: boolean; message?: string }>;
  lang: string;
}

export default function DeleteRestaurantModal({ deleteAction, lang }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await deleteAction();
      if (res.success) {
        router.push("/");
      } else {
        setError(res.message || "Xóa thất bại");
        setIsLoading(false);
      }
    } catch {
      setError("Error occurred while deleting the restaurant.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm border border-red-200 cursor-pointer"
      >
        🗑️ {lang === "vi" ? "Xóa quán" : "Delete"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {lang === "vi" ? "Xác nhận xóa nhà hàng" : "Delete Restaurant"}
              </h3>
              <p className="text-gray-600 text-sm">
                {lang === "vi"
                  ? "Bạn có chắc chắn muốn xóa nhà hàng này cùng toàn bộ danh mục và món ăn không? Hành động này không thể hoàn tác."
                  : "Are you sure you want to delete this restaurant and its menu? This action cannot be undone."}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-5 border border-red-100 flex gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                {lang === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isLoading
                  ? lang === "vi"
                    ? "Đang xử lý..."
                    : "Processing..."
                  : lang === "vi"
                    ? "Xóa vĩnh viễn"
                    : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
