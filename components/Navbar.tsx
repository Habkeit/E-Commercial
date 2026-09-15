// components/Navbar.tsx
"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useCartStore } from "@/app/store/cartStore";
import { useLanguageStore } from "@/app/store/languageStore";
import { dict } from "@/app/utils/dictionary";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const cart = useCartStore((state) => state.cart);
  const fetchCart = useCartStore((state) => state.fetchCart);

  const lang = useLanguageStore((state) => state.lang);
  const toggleLang = useLanguageStore((state) => state.toggleLang);
  const t = dict[lang];

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  
  const handleToggleLanguage = () => {
    const newLang = lang === "en" ? "vi" : "en";
    toggleLang();
    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000`;
    router.refresh();
  };

  const totalItems = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-50">
      <Link href="/" className="text-xl font-extrabold text-rose-600">
        🍔 FoodDelivery
      </Link>

      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={handleToggleLanguage}
          className="px-3 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
        >
          {lang === "en" ? "🇻🇳 VI" : "en EN"}
        </button>

        <Link
          href="/cart"
          className="relative text-gray-700 hover:text-rose-600 font-medium text-sm flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
        >
          <span>🛒 {t.cart}</span>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </Link>

        <Link
          href="/orders"
          className="flex items-center gap-1.5 text-gray-600 hover:text-rose-600 font-medium text-sm transition-colors"
        >
          📦 {t.orders}
        </Link>

        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              {t.signIn}
            </button>
          </SignInButton>
        </Show>

        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
