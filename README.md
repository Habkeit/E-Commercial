# 🍔 Food Delivery App

A production-ready, full-stack food delivery and restaurant management platform built with **Next.js 16 (App Router)**, **React 19**, **Drizzle ORM**, **PostgreSQL**, **Stripe**, **Clerk Authentication**, and **next-intl**.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Getting Started & Installation](#-getting-started--installation)
  - [Prerequisites](#prerequisites)
  - [Installation](#1-clone-and-install-dependencies)
  - [Environment Configuration](#2-configure-environment-variables)
  - [Database Setup & Migration](#3-database-setup-and-seeding)
  - [Running the Application](#4-run-the-development-server)
  - [Stripe Webhook Configuration (Stripe CLI)](#5-configure-stripe-webhook-with-stripe-cli)
- [Scripts Reference](#-scripts-reference)
- [License](#-license)

---

## 🌟 Overview

**Food Delivery App** bridges the gap between hungry customers and local culinary partners. Customers can explore partner restaurants, search for favorite dishes, customize and maintain a persistent shopping cart, and execute seamless payments via Stripe. 

Simultaneously, restaurant owners have access to a dedicated merchant management dashboard to register eateries, create categories, manage food inventories, synchronize items directly with Stripe Catalog, and process incoming customer orders in real-time.


## 🚀 Getting Started & Installation

### Prerequisites

Ensure you have installed the following tools on your local machine:
- **Node.js**: `v20.x` or later (LTS recommended)
- **npm**: `v10.x` or later (or `pnpm` / `yarn`)
- **Stripe CLI**: Required for local webhook forwarding ([Download Stripe CLI](https://stripe.com/docs/stripe-cli))
- **PostgreSQL Database**: Neon serverless database or a local PostgreSQL instance

---

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd food-delivery-app
npm install
```

---

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory by duplicating `.env.example`:

```bash
cp .env.example .env.local
```


### 3. Database Setup and Seeding

Push the Drizzle schema directly to your PostgreSQL database:

```bash
npx drizzle-kit push
```

*(Optional)* Seed realistic restaurants, food categories, and dishes:

```bash
npx tsx db/seed.ts
```

---

### 4. Run the Development Server

Start the Next.js local development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

### 5. Configure Stripe Webhook with Stripe CLI

Stripe requires webhooks to notify your server when a checkout session succeeds. In local development, forward events directly to your local endpoint using the **Stripe CLI**:

1. **Login to your Stripe account via CLI**:
   ```bash
   stripe login
   ```

2. **Start listening and forward events to your local API**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Obtain your Webhook Signing Secret**:
   The CLI terminal will output a webhook signing secret:
   ```text
   > Ready! Your webhook signing secret is whsec_1234567890abcdef... (^C to quit)
   ```

4. **Update `.env.local`**:
   Copy this secret and assign it to:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_1234567890abcdef..."
   ```

5. **Trigger a test event** *(optional)*:
   ```bash
   stripe trigger checkout.session.completed
   ```

---


## 📜 Scripts Reference

In `package.json`:

```bash
# Start Next.js development server
npm run dev

# Build production bundle
npm run build

# Start production server
npm run start

# Run ESLint checks
npm run lint

# Push schema directly to database using Drizzle Kit
npx drizzle-kit push

# Generate migration SQL files
npx drizzle-kit generate

# Run database seed script
npx tsx db/seed.ts
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
