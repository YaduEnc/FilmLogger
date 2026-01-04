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
      const { userId, planId } = session.metadata;
      console.log('Payment successful for user:', userId, 'Plan:', planId);
      
      if (userId && planId && session.subscription) {
        // Update user subscription in Firestore
        try {
          const apiUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : process.env.VITE_API_URL || 'http://localhost:3000';
          
          await fetch(`${apiUrl}/api/update-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              subscriptionData: {
                planId,
                status: 'active',
                subscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
                startDate: new Date().toISOString(),
              }
            })
          });
          console.log('Subscription updated in Firestore for user:', userId);
        } catch (error) {
          console.error('Error updating subscription in Firestore:', error);
        }
      }
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      // Get userId from subscription metadata or customer
      const updatedUserId = updatedSubscription.metadata?.userId;
      
      if (updatedUserId) {
        try {
          const apiUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : process.env.VITE_API_URL || 'http://localhost:3000';
          
          await fetch(`${apiUrl}/api/update-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: updatedUserId,
              subscriptionData: {
                planId: updatedSubscription.metadata?.planId || 'unknown',
                status: updatedSubscription.status === 'active' ? 'active' : 'inactive',
                subscriptionId: updatedSubscription.id,
                cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
                ...(updatedSubscription.cancel_at && {
                  endDate: new Date(updatedSubscription.cancel_at * 1000).toISOString()
                })
              }
            })
          });
          console.log('Subscription status updated in Firestore');
        } catch (error) {
          console.error('Error updating subscription status:', error);
        }
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      const deletedUserId = deletedSubscription.metadata?.userId;
      
      if (deletedUserId) {
        try {
          const apiUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : process.env.VITE_API_URL || 'http://localhost:3000';
          
          await fetch(`${apiUrl}/api/update-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: deletedUserId,
              subscriptionData: {
                planId: deletedSubscription.metadata?.planId || 'unknown',
                status: 'cancelled',
                subscriptionId: deletedSubscription.id,
                endDate: new Date().toISOString(),
              }
            })
          });
          console.log('Subscription cancelled in Firestore');
        } catch (error) {
          console.error('Error cancelling subscription:', error);
        }
      }
      break;

    case 'invoice.payment_failed':
      const invoice = event.data.object;
      const failedUserId = invoice.metadata?.userId || invoice.subscription_details?.metadata?.userId;
      
      if (failedUserId) {
        try {
          const apiUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : process.env.VITE_API_URL || 'http://localhost:3000';
          
          await fetch(`${apiUrl}/api/update-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: failedUserId,
              subscriptionData: {
                status: 'past_due',
                lastPaymentFailed: new Date().toISOString(),
              }
            })
          });
          console.log('Payment failure recorded in Firestore');
        } catch (error) {
          console.error('Error recording payment failure:', error);
        }
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return res.status(200).json({ received: true });
}
