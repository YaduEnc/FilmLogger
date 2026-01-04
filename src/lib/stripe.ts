import { loadStripe, Stripe } from "@stripe/stripe-js";

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error("Stripe publishable key is missing");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Plan prices in INR (in paise - smallest currency unit)
export const PLAN_PRICES = {
  pro: 19900, // ₹199.00
  legend: 49900, // ₹499.00
};

// Create checkout session
export const createCheckoutSession = async (planId: string, userId: string, userEmail: string) => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const response = await fetch(`${apiUrl}/api/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId,
        userId,
        userEmail,
        price: PLAN_PRICES[planId as keyof typeof PLAN_PRICES],
        successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment-cancel`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to create checkout session" }));
      throw new Error(errorData.message || "Failed to create checkout session");
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    // If backend is not available, show helpful error
    if (error.message?.includes("fetch") || error.message?.includes("Failed to fetch")) {
      throw new Error("Backend API is not available. Please set up the API server (see STRIPE_SETUP.md)");
    }
    throw error;
  }
};

// Alternative: Direct payment using Payment Intents (for custom UI)
export const createPaymentIntent = async (planId: string, userId: string) => {
  try {
    const response = await fetch("/api/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId,
        userId,
        amount: PLAN_PRICES[planId as keyof typeof PLAN_PRICES],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create payment intent");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
};
