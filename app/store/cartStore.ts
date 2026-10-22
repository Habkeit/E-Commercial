// app/store/cartStore.ts
import { create } from "zustand";
import {
  getCartAction,
  addToCartAction,
  removeFromCartAction,
} from "@/app/actions/cart";

export interface CartItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  restaurantName?: string;
}

interface CartState {
  cart: CartItem[];
  fetchCart: () => Promise<void>;
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (dishId: string) => Promise<void>;
  updateQuantity: (dishId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],

  fetchCart: async () => {
    try {
      const res = await getCartAction();
      if (res.success && res.cart) {
        set({ cart: res.cart });
      }
    } catch (err) {
      console.error("Failed to fetch cart from DB", err);
    }
  },

  addToCart: async (item) => {
    try {
      const res = await addToCartAction(item.dishId, item.quantity, item.note);
      if (res.success) {
        await get().fetchCart();
      }
    } catch (err) {
      console.error("Add to cart error", err);
    }
  },

  removeFromCart: async (dishId) => {
    try {
      await removeFromCartAction(dishId);
      set((state) => ({ cart: state.cart.filter((i) => i.dishId !== dishId) }));
    } catch (err) {
      console.error("Remove item error", err);
    }
  },

  updateQuantity: async (dishId, quantity) => {
    set((state) => ({
      cart: state.cart.map((i) =>
        i.dishId === dishId ? { ...i, quantity: Math.max(1, quantity) } : i,
      ),
    }));
  },

  clearCart: () => set({ cart: [] }),

  getTotalAmount: () => {
    return get().cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  },
}));
