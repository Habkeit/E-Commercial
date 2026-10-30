// lib/constants.ts
/**
 * Centralized constants for the Food Delivery App.
 * Single source of truth — eliminates magic strings scattered across the codebase.
 */

// --- Order Status ---
export const ORDER_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  DELIVERING: "Delivering",
  COMPLETED: "Completed",
  CANCELED: "Canceled",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_BADGES: Record<
  OrderStatus,
  { bg: string; text: string; fullClass: string }
> = {
  [ORDER_STATUS.PENDING]: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    fullClass: "bg-yellow-100 text-yellow-700",
  },
  [ORDER_STATUS.CONFIRMED]: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    fullClass: "bg-blue-100 text-blue-700",
  },
  [ORDER_STATUS.DELIVERING]: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    fullClass: "bg-purple-100 text-purple-700",
  },
  [ORDER_STATUS.COMPLETED]: {
    bg: "bg-green-100",
    text: "text-green-700",
    fullClass: "bg-green-100 text-green-700",
  },
  [ORDER_STATUS.CANCELED]: {
    bg: "bg-red-100",
    text: "text-red-700",
    fullClass: "bg-red-100 text-red-700",
  },
};

// --- Dish Status ---
export const DISH_STATUS = {
  ACTIVE: "active",
  PRE_ORDER: "pre_order",
  INACTIVE: "inactive",
} as const;

export type DishStatus = (typeof DISH_STATUS)[keyof typeof DISH_STATUS];

export const DISH_STATUS_BADGES: Record<
  DishStatus,
  { label: string; fullClass: string }
> = {
  [DISH_STATUS.ACTIVE]: {
    label: "Active",
    fullClass: "bg-emerald-100 text-emerald-700",
  },
  [DISH_STATUS.PRE_ORDER]: {
    label: "Pre-order",
    fullClass: "bg-amber-100 text-amber-700",
  },
  [DISH_STATUS.INACTIVE]: {
    label: "Inactive",
    fullClass: "bg-gray-200 text-gray-700",
  },
};

// --- Currency ---
export const CURRENCY = "vnd" as const;

// --- Payment ---
export const PAYMENT_METHOD_TYPES = ["card"] as const;

// --- Routes ---
export const APP_ROUTES = {
  HOME: "/",
  FOODS: "/foods",
  CART: "/cart",
  ORDERS: "/orders",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  RESTAURANT_DASHBOARD: "/restaurant/dashboard",
  RESTAURANT_ORDERS: "/restaurant/orders",
  RESTAURANT_REGISTER: "/restaurant/register",
  RESTAURANT_NEW_DISH: "/restaurant/dishes/new",
  RESTAURANT_NEW_CATEGORY: "/restaurant/categories/new",
} as const;

