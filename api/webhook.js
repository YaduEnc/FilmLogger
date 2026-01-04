// Stripe Webhook endpoint to handle payment events
// Vercel Serverless Function
// 
// IMPORTANT: Vercel automatically parses JSON bodies, which breaks Stripe signature verification.
// Solution: Use Stripe CLI for local testing, or configure Vercel to pass raw body.
// For production, you may need to use a different approach or middleware.

import Stripe from 'stripe';

// Vercel Serverless Function Handler
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

  // Get raw body - Vercel may parse it as JSON, so we need to handle both
  let rawBody;
  
  // Check if body is already a string (raw) or Buffer
  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (Buffer.isBuffer(req.body)) {
    rawBody = req.body;
  } else if (req.body && typeof req.body === 'object') {
    // Body was parsed as JSON - this breaks signature verification
    // For Vercel, we need the raw body as a string
    // Try to reconstruct it (this may not work perfectly for signature verification)
    rawBody = JSON.stringify(req.body);
    
    // Log warning
    console.warn('WARNING: Request body was parsed as JSON. Stripe signature verification may fail.');
    console.warn('For Vercel, you need to configure the route to receive raw body.');
    console.warn('Consider using Stripe CLI for local testing: stripe listen --forward-to localhost:3000/api/webhook');
    
    // Still try to verify, but it will likely fail
  } else {
    return res.status(400).json({ 
      error: 'Invalid request body',
      details: 'Request body must be a string or Buffer for Stripe webhook signature verification.'
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    console.error('This usually means the request body was parsed as JSON before reaching the handler.');
    console.error('Solution: Configure Vercel to pass raw body, or use Stripe CLI for testing.');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const { userId, planId } = session.metadata || {};
      console.log('Payment successful for user:', userId, 'Plan:', planId);
      
      if (userId && planId && session.subscription) {
        // Update user subscription in Firestore
        try {
          const apiUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : process.env.VITE_API_URL || 'http://localhost:3000';
          
          const updateResponse = await fetch(`${apiUrl}/api/update-subscription`, {
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

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Failed to update subscription:', errorText);
          } else {
            console.log('✅ Subscription updated in Firestore for user:', userId);
          }
        } catch (error) {
          console.error('Error updating subscription in Firestore:', error);
        }
      } else {
        console.warn('⚠️ Missing userId, planId, or subscription in checkout.session.completed event');
        console.warn('Session metadata:', session.metadata);
        console.warn('Session subscription:', session.subscription);
      }
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      const updatedUserId = updatedSubscription.metadata?.userId;
      
      if (updatedUserId) {
        try {
          const apiUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : process.env.VITE_API_URL || 'http://localhost:3000';
          
          const updateResponse = await fetch(`${apiUrl}/api/update-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: updatedUserId,
              subscriptionData: {
                planId: updatedSubscription.metadata?.planId || 'unknown',
                status: updatedSubscription.status === 'active' ? 'active' : 'inactive',
                subscriptionId: updatedSubscription.id,
                cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
                ...(updatedSubscription.current_period_end && {
                  endDate: new Date(updatedSubscription.current_period_end * 1000).toISOString()
                })
              }
            })
          });

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Failed to update subscription status:', errorText);
          } else {
            console.log('✅ Subscription status updated in Firestore');
          }
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
          
          const updateResponse = await fetch(`${apiUrl}/api/update-subscription`, {
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

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Failed to cancel subscription:', errorText);
          } else {
            console.log('✅ Subscription cancelled in Firestore');
          }
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
          
          const updateResponse = await fetch(`${apiUrl}/api/update-subscription`, {
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

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Failed to record payment failure:', errorText);
          } else {
            console.log('✅ Payment failure recorded in Firestore');
          }
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
