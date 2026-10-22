<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 1. Tech Stack
* Framework: Next.js (App Router, Server Actions, API Routes)

* Database & ORM: PostgreSQL (Neon Serverless) with Drizzle ORM

* Authentication: Clerk (@clerk/nextjs)

* Payment Gateway: Stripe API (Node.js SDK, Checkout Sessions, Webhooks)

* Internationalization: next-intl (EN/VI support)

* Styling: Tailwind CSS

## 2. Database & Schema Highlights (db/schema.ts)
* users: Stores user profiles linked to Clerk via clerkId.

* restaurants: Manages restaurant details, linked to owners via userId.

* dishes: Restaurant menu items, featuring stripePriceId for direct synchronization with the Stripe Product Catalog.

* cartItems: Manages shopping cart items per user (userId, dishId, quantity, note).

* orders & orderItems: Manages order records and statuses: "Pending", "Confirmed", "Delivering", "Completed", "Canceled".


## 3. 📂 Project Structure & Architecture Rules
* **Separation of Concerns:** Do not mix heavy business logic, DB queries, and UI inside a single component. Use Server Components for data fetching, Client Components strictly for interactivity, and modular Server Actions for mutations.
* `constants.ts`: Centralized file for Enums (Order Statuses, Validation Messages) to prevent hardcoded typos and improve maintainability.
* `app/api/`: RESTful Route Handlers (e.g., Stripe Webhooks, third-party webhook integrations).
* `app/actions/`: Modular Server Actions for form submissions and database mutations.
* `app/cart/` & `app/orders/`: UI pages managing cart interactions and order history.
* `db/`: Database configuration and Drizzle ORM schema definitions.
