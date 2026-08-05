import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addToCart: (item: CartItem) => void;
  removeFromCart: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      
      addToCart: (item) => set((state) => {
        const existingIndex = state.cart.findIndex((i) => i.dishId === item.dishId);
        if (existingIndex > -1) {
          const updatedCart = [...state.cart];
          updatedCart[existingIndex].quantity += item.quantity;
          if (item.note) updatedCart[existingIndex].note = item.note;
          return { cart: updatedCart };
        }
        return { cart: [...state.cart, item] };
      }),

      removeFromCart: (dishId) => set((state) => ({
        cart: state.cart.filter((i) => i.dishId !== dishId)
      })),

      updateQuantity: (dishId, quantity) => set((state) => ({
        cart: state.cart.map((i) => 
          i.dishId === dishId ? { ...i, quantity: Math.max(1, quantity) } : i
        )
      })),

      clearCart: () => set({ cart: [] }),

      getTotalAmount: () => {
        return get().cart.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
    }),
    {
      name: 'food-delivery-cart',
    }
  )
);