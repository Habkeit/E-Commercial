CREATE TYPE "public"."act_state" AS ENUM ('online', 'offline');

CREATE TYPE "public"."order_status" AS ENUM (
	'Pending',
	'Confirmed',
	'Delivering',
	'Completed',
	'Canceled'
);

CREATE TABLE
	"cart_items" (
		"id" uuid PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
		"user_id" uuid NOT NULL,
		"dish_id" uuid NOT NULL,
		"quantity" integer NOT NULL,
		"note" text,
		"created_at" timestamp DEFAULT now () NOT NULL,
		"updated_at" timestamp DEFAULT now () NOT NULL
	);

CREATE TABLE
	"dishes" (
		"id" uuid PRIMARY KEY NOT NULL,
		"restaurant_id" uuid NOT NULL,
		"category_id" uuid NOT NULL,
		"name" varchar(255) NOT NULL,
		"price" numeric(15, 2) NOT NULL,
		"description" text,
		"created_at" timestamp DEFAULT now () NOT NULL,
		"updated_at" timestamp DEFAULT now () NOT NULL
	);

CREATE TABLE
	"categories" (
		"id" uuid PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
		"name" varchar(100) NOT NULL,
		"description" text,
		"created_at" timestamp DEFAULT now () NOT NULL,
		"updated_at" timestamp DEFAULT now () NOT NULL,
		CONSTRAINT "categories_name_unique" UNIQUE ("name")
	);

CREATE TABLE
	"order_items" (
		"id" uuid PRIMARY KEY NOT NULL,
		"order_id" uuid NOT NULL,
		"dish_id" uuid NOT NULL,
		"quantity" integer NOT NULL,
		"price" numeric(15, 2) NOT NULL,
		"note" text,
		"created_at" timestamp DEFAULT now () NOT NULL,
		"updated_at" timestamp DEFAULT now () NOT NULL
	);

CREATE TABLE
	"orders" (
		"id" uuid PRIMARY KEY NOT NULL,
		"user_id" uuid NOT NULL,
		"total_amount" numeric(15, 2) NOT NULL,
		"delivery_address" text NOT NULL,
		-- "phone_number" varchar(15) NOT NULL,
		"status" "order_status" DEFAULT 'Pending' NOT NULL,
		"created_at" timestamp DEFAULT now () NOT NULL,
		"updated_at" timestamp DEFAULT now () NOT NULL
	);

CREATE TABLE
	"restaurants" (
		"id" uuid PRIMARY KEY NOT NULL,
		"user_id" uuid NOT NULL,
		"name" varchar(255) NOT NULL,
		"house_number" varchar(50) NOT NULL,
		"street" varchar(100) NOT NULL,
		"ward" varchar(100) NOT NULL,
		"province" varchar(100) NOT NULL,
		"logo" varchar(255),
		"note" text,
		"open_time" timestamp NOT NULL,
		"close_time" timestamp NOT NULL,
		"created_at" timestamp DEFAULT now () NOT NULL,
		"updated_at" timestamp DEFAULT now () NOT NULL,
		CONSTRAINT "restaurants_user_id_unique" UNIQUE ("user_id")
	);

CREATE TABLE
	"users" (
		"id" uuid PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
		"clerk_id" text NOT NULL,
		"email" text NOT NULL,
		"full_name" text,
		"created_at" timestamp DEFAULT now () NOT NULL,
		"updated_at" timestamp DEFAULT now () NOT NULL,
		CONSTRAINT "users_clerk_id_unique" UNIQUE ("clerk_id")
	);

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes" ("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "dishes" ADD CONSTRAINT "dishes_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants" ("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "dishes" ADD CONSTRAINT "dishes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories" ("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders" ("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes" ("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE no action ON UPDATE no action;