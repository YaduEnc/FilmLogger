// Helper API endpoint to update user subscription in Firestore
// Uses Firebase Admin SDK for secure server-side updates

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
let db = null;

function getFirestoreInstance() {
  if (db) {
    return db;
  }

  // Check if already initialized
  if (getApps().length === 0) {
    // Get service account from environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set. Please add your Firebase service account JSON to Vercel environment variables.');
    }

    let serviceAccount;
    try {
      // Parse the service account JSON (it should be a string in Vercel env vars)
      serviceAccount = typeof serviceAccountJson === 'string' 
        ? JSON.parse(serviceAccountJson) 
        : serviceAccountJson;
    } catch (error) {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it\'s valid JSON.');
    }

    // Initialize Firebase Admin
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  db = getFirestore();
  return db;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, subscriptionData } = req.body;
    
    if (!userId || !subscriptionData) {
      return res.status(400).json({ error: 'Missing userId or subscriptionData' });
    }

    // Get Firestore instance
    const firestore = getFirestoreInstance();
    
    // Get user document reference
    const userRef = firestore.collection('users').doc(userId);
    
    // Get current user data to merge subscription
    const userDoc = await userRef.get();
    const currentData = userDoc.exists ? userDoc.data() : {};
    
    // Merge subscription data
    const updatedSubscription = {
      ...(currentData.subscription || {}),
      ...subscriptionData,
      updatedAt: new Date().toISOString(),
    };
    
    // Update user document with subscription
    await userRef.set({
      ...currentData,
      subscription: updatedSubscription,
    }, { merge: true });
    
    console.log(`✅ Successfully updated subscription for user ${userId}:`, updatedSubscription);
    
    return res.status(200).json({ 
      success: true,
      subscription: updatedSubscription 
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return res.status(500).json({ 
      error: error.message,
      details: 'Check server logs for more information.'
    });
  }
}
