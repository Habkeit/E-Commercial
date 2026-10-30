// app/cart/CartItemQuantity.tsx
"use client";

import { useCartStore } from "@/app/store/cartStore";

interface CartItemQuantityProps {
  cartId: string;
  quantity: number;
  updateItemQuantity: (formData: FormData) => Promise<void>;
}

export default function CartItemQuantity({
  cartId,
  quantity,
  updateItemQuantity,
}: CartItemQuantityProps) {
  const fetchCart = useCartStore((state) => state.fetchCart);

  const handleAction = async (formData: FormData) => {
    await updateItemQuantity(formData);
    await fetchCart();
  };

  return (
    <div className="flex items-center space-x-3 self-end sm:self-auto">
      <form
        action={handleAction}
        className="flex items-center bg-gray-100 rounded-lg p-1"
      >
        <input type="hidden" name="cartId" value={cartId} />

        <button
          type="submit"
          name="action"
          value="decrease"
          className="w-8 h-8 flex items-center justify-center bg-white text-gray-600 rounded shadow-sm hover:bg-gray-50 transition-colors font-bold cursor-pointer"
        >
          -
        </button>

        <span className="w-10 text-center font-semibold text-sm text-gray-900">
          {quantity}
        </span>

        <button
          type="submit"
          name="action"
          value="increase"
          className="w-8 h-8 flex items-center justify-center bg-white text-gray-600 rounded shadow-sm hover:bg-gray-50 transition-colors font-bold cursor-pointer"
        >
          +
        </button>
      </form>

      <form action={handleAction}>
        <input type="hidden" name="cartId" value={cartId} />
        <button
          type="submit"
          name="action"
          value="remove"
          className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          title="Remove item"
        >
          🗑️
        </button>
      </form>
    </div>
  );
}
