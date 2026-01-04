// Backend API endpoint for creating Stripe Checkout Sessions
// Vercel Serverless Function

// IMPORTANT: Set your Stripe secret key in environment variables
// Never hardcode secrets in production code!
// Set STRIPE_SECRET_KEY in your environment variables (Vercel, .env, etc.)

import Stripe from 'stripe';

// Initialize Stripe - check will happen in handler
let stripe = null;

const PLAN_CONFIG = {
  pro: {
    name: "Pro Archivist",
    price: 19900, // ₹199.00 in paise
    currency: "inr",
  },
  legend: {
    name: "Cinema Legend",
    price: 49900, // ₹499.00 in paise
    currency: "inr",
  },
};

// Vercel Serverless Function Handler
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for Stripe secret key
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY environment variable is missing');
    return res.status(500).json({ 
      error: 'Server configuration error: STRIPE_SECRET_KEY is not set. Please add it in Vercel environment variables.' 
    });
  }

  // Initialize Stripe if not already done
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  try {
    const { planId, userId, userEmail, successUrl, cancelUrl } = req.body;

    if (!planId || !userId || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const plan = PLAN_CONFIG[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: userEmail,
      metadata: {
        userId,
        planId,
      },
      success_url: successUrl || `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/payment-cancel`,
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: error.message });
  }
}

// For Node.js/Express:
/*
const express = require('express');
const router = express.Router();

router.post('/create-checkout-session', async (req, res) => {
  // Same logic as above
});

module.exports = router;
*/
