'use client';

import { useState } from 'react';
import { useCartStore } from '@/app/store/cartStore'; // Import Zustand Store
import { useRouter } from 'next/navigation';

interface Props {
  dish: {
    id: string;
    name: string;
    price: string | number;
    restaurant?: { name: string } | null;
  };
}

export default function AddToCartButton({ dish }: Props) {
  // Extract only the function you need from the store
  const addToCart = useCartStore((state) => state.addToCart);
  const router = useRouter();
  
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);

  const handleAdd = () => {
    addToCart({
      dishId: dish.id,
      name: dish.name,
      price: Number(dish.price),
      quantity: quantity,
      note: note,
      restaurantName: dish.restaurant?.name || 'Restaurant',
    });

    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Note for the restaurant (e.g., Less spicy):
        </label>
        <input 
          type="text" 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter your note..." 
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
          >
            -
          </button>
          <span className="px-4 py-2 text-center font-medium w-12">{quantity}</span>
          <button 
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
          >
            +
          </button>
        </div>

        <button 
          onClick={handleAdd}
          className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-rose-500/20"
        >
          Add to Cart
        </button>
      </div>

      {showNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg text-center font-medium animate-fade-in">
          ✅ Added to cart successfully!
        </div>
      )}

      <button 
        onClick={() => router.push('/cart')}
        className="w-full bg-gray-900 hover:bg-black text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
      >
        View Cart & Checkout 🛒
      </button>
    </div>
  );
}