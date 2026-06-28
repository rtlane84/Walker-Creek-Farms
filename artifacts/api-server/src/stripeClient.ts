import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("STRIPE_SECRET_KEY environment variable is required");
    _stripe = new Stripe(secretKey, { apiVersion: "2026-06-24.dahlia" as any });
  }
  return _stripe;
}
