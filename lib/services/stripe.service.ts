// lib/services/stripe.service.ts
/**
 * Stripe Catalog synchronization service.
 * Centralizes Product/Price lifecycle management that was duplicated
 * across dashboard, dishes API, checkout, and payment retry.
 */
import { stripe } from "@/lib/stripe";
import { CURRENCY, PAYMENT_METHOD_TYPES } from "@/lib/constants";

interface CreateProductResult {
  stripePriceId: string;
  stripeProductId: string;
}

/**
 * Create a new Stripe Product and its initial Price.
 * Used when a restaurant owner adds a dish or when a legacy dish
 * without a stripePriceId enters the checkout pipeline.
 */
export async function createProductAndPrice(
  name: string,
  unitAmount: number,
  metadata?: Record<string, string>,
): Promise<CreateProductResult> {
  const product = await stripe.products.create({
    name,
    metadata: metadata ?? {},
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: CURRENCY,
    unit_amount: unitAmount,
  });

  return {
    stripePriceId: price.id,
    stripeProductId: product.id,
  };
}

/**
 * Synchronize a dish update to its corresponding Stripe Product/Price.
 *
 * - If the dish already has a stripePriceId, updates the existing product.
 * - If the price changed, creates a new Price (Stripe prices are immutable).
 * - If no stripePriceId exists, creates a brand-new product + price.
 *
 * Returns the current stripePriceId (may be new if price changed).
 */
export async function syncDishToStripe(
  existingPriceId: string | null,
  dishName: string,
  previousName: string | null,
  newPrice: number,
  previousPrice: number | null,
  isActive: boolean,
): Promise<string | null> {
  try {
    if (existingPriceId) {
      const currentPriceObj = await stripe.prices.retrieve(existingPriceId);
      const productId = currentPriceObj.product as string;

      // Update product name if changed
      if (previousName !== null && previousName !== dishName) {
        await stripe.products.update(productId, { name: dishName });
      }

      let finalPriceId = existingPriceId;

      // Create new price if amount changed (Stripe prices are immutable)
      if (previousPrice !== null && previousPrice !== newPrice) {
        const newStripePrice = await stripe.prices.create({
          product: productId,
          currency: CURRENCY,
          unit_amount: newPrice,
        });
        finalPriceId = newStripePrice.id;
      }

      // Sync active status
      await stripe.products.update(productId, { active: isActive });

      return finalPriceId;
    }

    // No existing Stripe data — create from scratch
    if (dishName && newPrice >= 0) {
      const { stripePriceId } = await createProductAndPrice(dishName, newPrice);
      return stripePriceId;
    }

    return null;
  } catch (error) {
    console.error("Error syncing dish to Stripe:", error);
    return existingPriceId;
  }
}

/**
 * Archive (deactivate) a Stripe Product when a dish is deleted.
 */
export async function archiveStripeProduct(
  stripePriceId: string,
): Promise<void> {
  try {
    const priceObj = await stripe.prices.retrieve(stripePriceId);
    const productId = priceObj.product as string;
    await stripe.products.update(productId, { active: false });
  } catch (error) {
    console.error("Error archiving Stripe product:", error);
  }
}

/**
 * Ensure a dish has a valid stripePriceId.
 * If it already has one, returns it immediately.
 * Otherwise, creates a Stripe Product + Price on the fly (lazy provisioning).
 */
export async function ensureStripePriceId(
  currentPriceId: string | null,
  dishName: string,
  unitAmount: number,
): Promise<string> {
  if (currentPriceId) return currentPriceId;

  const { stripePriceId } = await createProductAndPrice(dishName, unitAmount);
  return stripePriceId;
}

/**
 * Create a Stripe Checkout Session with standardized metadata and line items.
 * Used by both initial checkout and the re-payment retry flow.
 */
export async function createCheckoutSession({
  lineItems,
  orderId,
  userId,
  successUrl,
  cancelUrl,
}: {
  lineItems: Array<{ price: string; quantity: number }>;
  orderId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    payment_method_types: [...PAYMENT_METHOD_TYPES],
    line_items: lineItems,
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      orderId,
      userId,
    },
  });
}

