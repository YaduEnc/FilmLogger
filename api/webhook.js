// Stripe Webhook endpoint to handle payment events
// Vercel Serverless Function
// Configure webhook URL in Stripe Dashboard: https://dashboard.stripe.com/webhooks

import Stripe from 'stripe';

// Vercel Serverless Function Handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for required environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY environment variable is missing');
    return res.status(500).json({ 
      error: 'Server configuration error: STRIPE_SECRET_KEY is not set.' 
    });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET environment variable is missing');
    return res.status(500).json({ 
      error: 'Server configuration error: STRIPE_WEBHOOK_SECRET is not set.' 
    });
  }

  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Update user subscription in database
      const { userId, planId } = session.metadata;
      console.log('Payment successful for user:', userId, 'Plan:', planId);
      // TODO: Update user subscription in Firestore
      // await updateUserSubscription(userId, planId, session.subscription);
      break;

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      // Handle subscription updates/cancellations
      console.log('Subscription updated:', subscription.id);
      // TODO: Update subscription status in database
      break;

    case 'invoice.payment_failed':
      const invoice = event.data.object;
      // Handle failed payment
      console.log('Payment failed for invoice:', invoice.id);
      // TODO: Notify user and update subscription status
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return res.status(200).json({ received: true });
}
