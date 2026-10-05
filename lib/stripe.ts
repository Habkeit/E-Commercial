// lib/stripe.ts
/**
 * Singleton Stripe client.
 * Previously instantiated in 4+ separate files with duplicated apiVersion strings.
 */
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
});
