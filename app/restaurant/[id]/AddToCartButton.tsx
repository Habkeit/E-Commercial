// app/restaurant/[id]/AddToCartButton.tsx
"use client";

import { message } from "antd";
import { addToCart } from "./actions";
import { useState } from "react";
import { useCartStore } from "@/app/store/cartStore";

interface AddToCartButtonProps {
  dishId: string;
}

export default function AddToCartButton({ dishId }: AddToCartButtonProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);
  const fetchCart = useCartStore((state) => state.fetchCart);

  const handleAddToCart = async () => {
    try {
      setIsLoading(true);
      
      await addToCart(dishId);
      
      await fetchCart();

      messageApi.success("🎉 Successfully added to cart!");
    } catch (error) {
      console.error(error);
      messageApi.error("❌ Failed to add to cart. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isLoading}
        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
      >
        {isLoading ? "Adding..." : "Add to Cart"}
      </button>
    </>
  );
}