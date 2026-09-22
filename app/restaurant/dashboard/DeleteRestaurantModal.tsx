// app/restaurant/dashboard/DeleteRestaurantModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface Props {
  deleteAction: () => Promise<{ success: boolean; message?: string }>;
}

export default function DeleteRestaurantModal({ deleteAction }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("RestaurantDashboard");

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await deleteAction();
      if (res.success) {
        router.push("/");
      } else {
        setError(res.message || t("deleteErrorGeneric"));
        setIsLoading(false);
      }
    } catch {
      setError(t("deleteErrorGeneric"));
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm border border-red-200 cursor-pointer"
      >
        🗑️ {t("deleteBtn")}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t("deleteModalTitle")}
              </h3>
              <p className="text-gray-600 text-sm">{t("deleteModalDesc")}</p>
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
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {t("deleteModalCancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? t("processing") : t("deleteModalConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
