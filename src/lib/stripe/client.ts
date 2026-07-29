import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("[Crealy] Falta STRIPE_SECRET_KEY.");
  }

  stripeClient = new Stripe(secretKey, {
    appInfo: {
      name: "Crealy",
      version: "0.1.0",
    },
  });
  return stripeClient;
}
