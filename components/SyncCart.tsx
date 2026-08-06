// components/SyncCart.tsx
"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useCartStore } from "@/app/store/cartStore";

export default function SyncCart() {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      const syncUserDataAndCart = async () => {
        try {
          // Lấy trực tiếp trạng thái cart hiện tại từ getState() để tránh phụ thuộc vào biến ngoài hook
          const currentCart = useCartStore.getState().cart;

          await fetch("/api/sync-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              fullName: user.fullName,
              localCart: currentCart,
            }),
          });
        } catch (error) {
          console.error("Error syncing user and cart:", error);
        }
      };

      syncUserDataAndCart();
    }
  }, [isSignedIn, user]);

  return null;
}
