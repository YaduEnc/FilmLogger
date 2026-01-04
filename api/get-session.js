// Backend API endpoint to retrieve Stripe Checkout Session details
// Vercel Serverless Function

import Stripe from 'stripe';

// Initialize Stripe - check will happen in handler
let stripe = null;

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for Stripe secret key
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY environment variable is missing');
    return res.status(500).json({ 
      error: 'Server configuration error: STRIPE_SECRET_KEY is not set.' 
    });
  }

  // Initialize Stripe if not already done
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    // Retrieve the checkout session with expanded customer and subscription
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer', 'subscription', 'payment_intent'],
    });

    // Get customer details if available
    let customer = null;
    if (session.customer) {
      if (typeof session.customer === 'string') {
        customer = await stripe.customers.retrieve(session.customer);
      } else {
        customer = session.customer;
      }
    }

    // Format response
    const response = {
      id: session.id,
      amount_total: session.amount_total,
      amount_subtotal: session.amount_subtotal,
      currency: session.currency,
      customer_email: session.customer_email,
      customer_details: session.customer_details,
      payment_status: session.payment_status,
      status: session.status,
      created: session.created,
      metadata: session.metadata,
      subscription: session.subscription,
      planId: session.metadata?.planId,
      userId: session.metadata?.userId,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error retrieving session:', error);
    return res.status(500).json({ error: error.message });
  }
}
