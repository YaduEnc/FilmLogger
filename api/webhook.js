// Stripe Webhook endpoint to handle payment events
// Vercel Serverless Function
// 
// IMPORTANT: For Vercel, the request body is automatically parsed as JSON.
// We need to access the raw body for Stripe signature verification.
// Solution: Read from request stream before parsing, or use Vercel's rawBody if available.

import Stripe from 'stripe';

// Helper to read raw body from request stream
function getRawBodyFromStream(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

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

  // Get raw body - try multiple methods for Vercel compatibility
  let rawBody;
  
  try {
    // Method 1: Check if rawBody is available (some Vercel setups expose this)
    if (req.rawBody) {
      rawBody = typeof req.rawBody === 'string' ? req.rawBody : Buffer.from(req.rawBody);
      console.log('✅ Using req.rawBody');
    }
    // Method 2: Check if body is already a string or Buffer (raw)
    else if (typeof req.body === 'string') {
      rawBody = req.body;
      console.log('✅ Using req.body as string');
    } 
    else if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
      console.log('✅ Using req.body as Buffer');
    }
    // Method 3: Try to read from stream (if not already parsed)
    else if (req.readable && !req.body) {
      rawBody = await getRawBodyFromStream(req);
      console.log('✅ Read from request stream');
    }
    // Method 4: Body was parsed as JSON - this will fail signature verification
    else if (req.body && typeof req.body === 'object') {
      // This is the problem - Vercel parsed it as JSON
      console.error('❌ ERROR: Request body was parsed as JSON by Vercel.');
      console.error('This breaks Stripe signature verification.');
      console.error('');
      console.error('SOLUTIONS:');
      console.error('1. Use Stripe CLI for testing: stripe listen --forward-to localhost:3000/api/webhook');
      console.error('2. For production, you may need to use a proxy or different approach');
      console.error('3. Consider using Stripe\'s webhook endpoint verification in a different way');
      console.error('');
      console.error('Attempting to reconstruct body (signature verification will likely fail):');
      rawBody = JSON.stringify(req.body);
    } 
    else {
      return res.status(400).json({ 
        error: 'Invalid request body',
        details: 'Request body must be raw (string/Buffer) for Stripe webhook signature verification.'
      });
    }
  } catch (error) {
    console.error('Error reading raw body:', error);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  if (!rawBody) {
    return res.status(400).json({ error: 'Empty request body' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log('✅ Webhook signature verified successfully');
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    console.error('');
    console.error('This usually happens because:');
    console.error('1. Vercel parsed the JSON body before it reached this handler');
    console.error('2. The webhook secret is incorrect');
    console.error('3. The request was modified by a proxy or middleware');
    console.error('');
    console.error('For local testing, use Stripe CLI:');
    console.error('  stripe listen --forward-to localhost:3000/api/webhook');
    console.error('');
    console.error('For production on Vercel, you may need to:');
    console.error('1. Use a different webhook handling approach');
    console.error('2. Set up a proxy that preserves raw body');
    console.error('3. Use Stripe\'s webhook endpoint verification differently');
    
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const { userId, planId } = session.metadata || {};
      console.log('✅ Payment successful for user:', userId, 'Plan:', planId);
      
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
            console.error('❌ Failed to update subscription:', errorText);
          } else {
            console.log('✅ Subscription updated in Firestore for user:', userId);
          }
        } catch (error) {
          console.error('❌ Error updating subscription in Firestore:', error);
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
            console.error('❌ Failed to update subscription status:', errorText);
          } else {
            console.log('✅ Subscription status updated in Firestore');
          }
        } catch (error) {
          console.error('❌ Error updating subscription status:', error);
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
            console.error('❌ Failed to cancel subscription:', errorText);
          } else {
            console.log('✅ Subscription cancelled in Firestore');
          }
        } catch (error) {
          console.error('❌ Error cancelling subscription:', error);
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
            console.error('❌ Failed to record payment failure:', errorText);
          } else {
            console.log('✅ Payment failure recorded in Firestore');
          }
        } catch (error) {
          console.error('❌ Error recording payment failure:', error);
        }
      }
      break;

    default:
      console.log(`ℹ️ Unhandled event type ${event.type}`);
  }

  return res.status(200).json({ received: true });
}
