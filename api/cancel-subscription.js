// API endpoint to cancel Stripe subscription
// Vercel Serverless Function

import Stripe from 'stripe';

let stripe = null;

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

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ 
      error: 'Server configuration error: STRIPE_SECRET_KEY is not set.' 
    });
  }

  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  try {
    const { subscriptionId, userId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId is required' });
    }

    // Cancel the subscription at period end
    const cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update Firestore via update-subscription endpoint
    if (userId) {
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
              cancelAtPeriodEnd: true,
              status: 'active', // Still active until period ends
              ...(cancelledSubscription.cancel_at && {
                endDate: new Date(cancelledSubscription.cancel_at * 1000).toISOString()
              })
            }
          })
        });
      } catch (error) {
        console.error('Error updating Firestore:', error);
        // Don't fail the request if Firestore update fails
      }
    }

    return res.status(200).json({ 
      success: true,
      subscription: cancelledSubscription 
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ error: error.message });
  }
}
