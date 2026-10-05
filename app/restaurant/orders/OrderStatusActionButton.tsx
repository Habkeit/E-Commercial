"use client";

import { useTransition } from "react";
import { updateOrderStatusAction } from "@/app/actions/order";
import { type OrderStatus } from "@/lib/constants";

interface OrderStatusActionButtonProps {
  orderId: string;
  targetStatus: OrderStatus;
  label: string;
  className: string;
}

export default function OrderStatusActionButton({
  orderId,
  targetStatus,
  label,
  className,
}: OrderStatusActionButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, targetStatus);
      } catch (error) {
        console.error("Failed to update order status:", error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleUpdate}
      disabled={isPending}
      className={`${className} ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {isPending ? "..." : label}
    </button>
  );
}
