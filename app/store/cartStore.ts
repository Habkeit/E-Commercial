import { create } from "zustand";

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

  // Lấy giỏ hàng từ Database lên
  fetchCart: async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success) {
        set({ cart: data.cart });
      }
    } catch (err) {
      console.error("Failed to fetch cart from DB", err);
    }
  },

  addToCart: async (item) => {
    // Cập nhật giao diện trước cho mượt (Optimistic Update) hoặc gọi API xong fetch lại
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishId: item.dishId,
          quantity: item.quantity,
          note: item.note,
        }),
      });
      await get().fetchCart(); // Tải lại giỏ hàng mới nhất từ DB
    } catch (err) {
      console.error("Add to cart error", err);
    }
  },

  removeFromCart: async (dishId) => {
    try {
      await fetch(`/api/cart?dishId=${dishId}`, { method: "DELETE" });
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
    // Bạn có thể gọi API cập nhật số lượng ở đây nếu muốn lưu chặt chẽ vào DB
  },

  clearCart: () => set({ cart: [] }),

  getTotalAmount: () => {
    return get().cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  },
}));
