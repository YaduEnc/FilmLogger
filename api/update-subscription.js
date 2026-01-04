// Helper API endpoint to update user subscription in Firestore
// Uses Firebase REST API (no Admin SDK needed)

async function updateUserSubscription(userId, subscriptionData) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    throw new Error('Firebase project ID not configured');
  }

  // Build Firestore REST API URL
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`;
  
  // Build fields object for Firestore REST API format
  const fields = {};
  
  if (subscriptionData.planId) {
    fields.planId = { stringValue: subscriptionData.planId };
  }
  if (subscriptionData.status) {
    fields.status = { stringValue: subscriptionData.status };
  }
  if (subscriptionData.subscriptionId) {
    fields.subscriptionId = { stringValue: subscriptionData.subscriptionId };
  }
  if (subscriptionData.startDate) {
    fields.startDate = { stringValue: subscriptionData.startDate };
  }
  if (subscriptionData.endDate) {
    fields.endDate = { stringValue: subscriptionData.endDate };
  }
  if (subscriptionData.cancelAtPeriodEnd !== undefined) {
    fields.cancelAtPeriodEnd = { booleanValue: subscriptionData.cancelAtPeriodEnd };
  }
  if (subscriptionData.lastPaymentFailed) {
    fields.lastPaymentFailed = { stringValue: subscriptionData.lastPaymentFailed };
  }

  // Use PATCH with updateMask to merge fields
  const updateMask = Object.keys(fields).join(',');
  const updateUrl = `${url}?updateMask.fieldPaths=subscription.${updateMask.split(',').join('&updateMask.fieldPaths=subscription.')}`;
  
  // Get current document to merge
  const getResponse = await fetch(url);
  const currentDoc = await getResponse.json();
  
  // Merge subscription object
  const currentFields = currentDoc.fields || {};
  const currentSubscription = currentFields.subscription?.mapValue?.fields || {};
  
  // Merge new subscription data
  const mergedSubscription = {
    ...currentSubscription,
    ...fields
  };
  
  // Update document
  const updateResponse = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        ...currentFields,
        subscription: {
          mapValue: {
            fields: mergedSubscription
          }
        }
      }
    })
  });
  
  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`Failed to update subscription: ${updateResponse.statusText} - ${errorText}`);
  }
  
  return updateResponse.json();
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

    await updateUserSubscription(userId, subscriptionData);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return res.status(500).json({ error: error.message });
  }
}
