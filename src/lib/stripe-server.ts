// Server-side Stripe utilities
// This file should be used in your backend/API routes
// For Firebase Functions or Node.js backend

import Stripe from "stripe";

// Initialize Stripe with secret key
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "",
  {
    apiVersion: "2024-12-18.acacia",
  }
);

// Plan configuration
export const PLAN_CONFIG = {
  pro: {
    name: "Pro Archivist",
    price: 19900, // ₹199.00 in paise
    currency: "inr",
    interval: "month" as const,
  },
  legend: {
    name: "Cinema Legend",
    price: 49900, // ₹499.00 in paise
    currency: "inr",
    interval: "month" as const,
  },
};

// Create Checkout Session
export async function createCheckoutSession(
  planId: string,
  userId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
) {
  const plan = PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG];
  
  if (!plan) {
    throw new Error("Invalid plan ID");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          product_data: {
            name: plan.name,
            description: `Monthly subscription for ${plan.name}`,
          },
          unit_amount: plan.price,
          recurring: {
            interval: plan.interval,
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    customer_email: userEmail,
    metadata: {
      userId,
      planId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

// Create Payment Intent (for one-time payments)
export async function createPaymentIntent(
  planId: string,
  userId: string,
  amount: number
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "inr",
    metadata: {
      userId,
      planId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
) {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
