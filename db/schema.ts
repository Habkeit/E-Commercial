// db/schema.ts
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- ENUMS ---
export const actStateEnum = pgEnum("act_state", ["online", "offline"]);
export const orderStatusEnum = pgEnum("order_status", [
  "Pending",
  "Confirmed",
  "Delivering",
  "Completed",
  "Canceled",
]);

// --- TABLES ---
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const restaurants = pgTable("restaurants", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  houseNumber: varchar("house_number", { length: 50 }).notNull(),
  street: varchar("street", { length: 100 }).notNull(),
  ward: varchar("ward", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  logo: varchar("logo", { length: 255 }),
  note: text("note"),
  openTime: timestamp("open_time").notNull(),
  closeTime: timestamp("close_time").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dishes = pgTable("dishes", {
  id: uuid("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull(),
  categoryId: uuid("category_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  stock: integer("stock").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  status: text("status").default("active").notNull(),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  restaurantId: uuid("restaurant_id").notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  status: orderStatusEnum("status").notNull().default("Pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey(),
  orderId: uuid("order_id").notNull(),
  dishId: uuid("dish_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey(),
  userId: text("user_id").notNull(),
  dishId: uuid("dish_id").notNull(),
  quantity: integer("quantity").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- RELATIONS ---
export const usersRelations = relations(users, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [users.clerkId],
    references: [restaurants.userId],
  }),
  orders: many(orders),
  cartItems: many(cartItems),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  user: one(users, {
    fields: [restaurants.userId],
    references: [users.clerkId],
  }),
  categories: many(categories),
  dishes: many(dishes),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [categories.restaurantId],
    references: [restaurants.id],
  }),
  dishes: many(dishes),
}));

export const dishesRelations = relations(dishes, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [dishes.restaurantId],
    references: [restaurants.id],
  }),
  category: one(categories, {
    fields: [dishes.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  dish: one(dishes, {
    fields: [orderItems.dishId],
    references: [dishes.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  dish: one(dishes, {
    fields: [cartItems.dishId],
    references: [dishes.id],
  }),
}));
