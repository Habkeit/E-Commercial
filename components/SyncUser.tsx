// components/SyncUser.tsx
"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useCartStore } from "@/app/store/cartStore";

export default function SyncUser() {
  const { user, isSignedIn, isLoaded } = useUser();
  const fetchCart = useCartStore((state) => state.fetchCart);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      const clerkId = user.id;
      const email = user.emailAddresses[0]?.emailAddress || "";
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

      fetch("/api/sync-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkId,
          email,
          fullName,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log("User synced successfully");
            fetchCart(); // Kéo giỏ hàng từ DB lên sau khi sync user thành công
          }
        })
        .catch((err) => console.error("Sync user error:", err));
    }
  }, [isLoaded, isSignedIn, user, fetchCart]);

  return null;
}
