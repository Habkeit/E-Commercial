"use client";

import { useState } from "react";
import { useCartStore } from "@/app/store/cartStore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const router = useRouter();

  // State for managing order information
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const handleCheckout = async () => {
    if (!address || !phoneNumber) {
      alert("Please fill in both Delivery Address and Phone Number!");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: cart,
          deliveryAddress: address,
          phoneNumber: phoneNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `🎉 Order placed successfully! Your Order ID is: ${data.orderId}`,
        );
        clearCart(); // Clear the cart after successful order
        router.push("/"); // Redirect to homepage
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("Cannot connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🛒 Your cart is empty
          </h2>
          <p className="text-gray-500 mb-6">
            Take a look at our menu and choose your favorite dishes!
          </p>
          <Link
            href="/foods"
            className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Explore Menu Now
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items Section */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🛒 Shopping Cart
          </h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div
                  key={item.dishId}
                  className="py-4 flex justify-between items-center gap-4"
                >
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Restaurant: {item.restaurantName || "N/A"}
                    </p>
                    {item.note && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        Note: {item.note}
                      </p>
                    )}
                    <p className="text-rose-600 font-semibold mt-1">
                      {item.price.toLocaleString("en-US")} VND
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Quantity Modifier Buttons */}
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          updateQuantity(item.dishId, item.quantity - 1)
                        }
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-center font-medium text-sm w-10">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.dishId, item.quantity + 1)
                        }
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <span className="font-bold text-gray-900 block mb-1">
                        {(item.price * item.quantity).toLocaleString("en-US")}{" "}
                        VND
                      </span>
                      <button
                        onClick={() => removeFromCart(item.dishId)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-right">
              <button
                onClick={clearCart}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Delivery Info & Checkout Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-4">
            Delivery Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., 0987654321"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-800 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter house number, street name, ward/district..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none h-24 resize-none text-gray-800 placeholder-gray-400"
            ></textarea>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <span className="text-gray-500">Total Payment:</span>
            <span className="text-2xl font-extrabold text-rose-600">
              {totalAmount.toLocaleString("en-US")} VND
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isSubmitting}
            className={`w-full text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-rose-500/20 ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-rose-500 hover:bg-rose-600"}`}
          >
            {isSubmitting ? "Processing..." : "Confirm Order 🚀"}
          </button>
        </div>
      </div>
    </main>
  );
}
