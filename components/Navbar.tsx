// components/Navbar.tsx
"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-100">
      <Link href="/foods" className="text-xl font-extrabold text-rose-600">
        🍔 FoodDelivery
      </Link>

      <div className="flex items-center space-x-4">
        <Link
          href="/cart"
          className="text-gray-700 hover:text-rose-600 font-medium text-sm"
        >
          Cart 🛒
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
