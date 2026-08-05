import {
  pgTable,
  varchar,
  decimal,
  text,
  pgEnum,
  timestamp,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const actStateEnum = pgEnum("act_state", ["online", "offline"]);

// ten bien, table, field -> eng
// id -> uuid
// moi table -> timestamp
// password -> hash
// field lien quan den gio -> bat buoc timestamp


export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Generate UUIDv7 at application level before inserting
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // Hashed password
  actState: actStateEnum("act_state").default("offline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 15 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const restaurants = pgTable("restaurants", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  houseNumber: varchar("house_number", { length: 50 }).notNull(),
  street: varchar("street", { length: 100 }).notNull(),
  ward: varchar("ward", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  logo: varchar("logo", { length: 255 }),
  note: text("note"),
  openTime: timestamp("open_time").notNull(),
  closeTime: timestamp("close_time").notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dishes = pgTable("dishes", {
  id: uuid("id").primaryKey(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id),
  categoryId: uuid("category_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  phoneNumber: varchar("phone_number", { length: 15 }).notNull(),
  status: varchar("status", { length: 50 }).default("Pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  dishId: uuid("dish_id")
    .notNull()
    .references(() => dishes.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



export const customerRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  orders: many(orders),
}));

export const restaurantRelations = relations(restaurants, ({ one, many }) => ({
  user: one(users, {
    fields: [restaurants.userId],
    references: [users.id],
  }),
  dishes: many(dishes),
}));

export const dishRelations = relations(dishes, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [dishes.restaurantId],
    references: [restaurants.id],
  }),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  dish: one(dishes, {
    fields: [orderItems.dishId],
    references: [dishes.id],
  }),
}));