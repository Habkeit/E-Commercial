// components/Navbar.tsx
"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useCartStore } from "@/app/store/cartStore";
import { useEffect } from "react";

export default function Navbar() {
  const cart = useCartStore((state) => state.cart);
  const fetchCart = useCartStore((state) => state.fetchCart);

  // Tự động đồng bộ giỏ hàng từ DB khi load trang hoặc F5
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const totalItems = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-50">
      <Link href="/" className="text-xl font-extrabold text-rose-600">
        🍔 FoodDelivery
      </Link>

      <div className="flex items-center space-x-4">
        <Link
          href="/cart"
          className="relative text-gray-700 hover:text-rose-600 font-medium text-sm flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
        >
          <span>🛒 Cart</span>
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
          📦 Orders
        </Link>

        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Sign In
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
