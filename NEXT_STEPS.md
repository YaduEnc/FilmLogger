# ✅ Next Steps for Stripe Integration

You've added `STRIPE_SECRET_KEY` to your environment variables. Here's what to do next:

## Step 1: Frontend Environment Variables ✅

I've created `.env.local` with your publishable key. This file is already configured.

## Step 2: Deploy to Vercel (Recommended)

Since you have `vercel.json`, you can deploy to Vercel which will automatically handle the serverless functions:

### Option A: Deploy via Vercel Dashboard

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Add Stripe integration"
   git push
   ```

2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
   - Import your GitHub repository
   - Vercel will auto-detect your project

3. **Add Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add these (use your actual keys from Stripe Dashboard):
     ```
     STRIPE_SECRET_KEY=sk_test_... (your secret key)
     VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (your publishable key)
     ```

4. **Deploy** - Vercel will automatically:
   - Deploy your frontend
   - Set up serverless functions from `/api` folder
   - Your API will be available at: `https://your-project.vercel.app/api/...`

5. **Update `.env.local`** with your Vercel URL:
   ```env
   VITE_API_URL=https://your-project.vercel.app
   ```

### Option B: Test Locally with Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Run locally:**
   ```bash
   vercel dev
   ```

3. **Add environment variables** when prompted, or set them in Vercel Dashboard

## Step 3: Configure Stripe Webhooks

After deploying:

1. **Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)**
2. **Click "Add endpoint"**
3. **Enter your webhook URL:**
   ```
   https://your-project.vercel.app/api/webhook
   ```
4. **Select events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. **Copy the webhook signing secret** (starts with `whsec_...`)
6. **Add it to Vercel environment variables:**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Step 4: Test the Integration

1. **Start your frontend:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** `/membership` or `/checkout/pro` or `/checkout/legend`

3. **Click "Complete Order"** - it will redirect to Stripe Checkout

4. **Use test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

5. **After payment**, you'll be redirected to `/payment-success`

## Step 5: Update User Subscription in Database

You need to implement the database update in `api/webhook.js`:

```javascript
// In api/webhook.js, replace the TODO comments with:
case 'checkout.session.completed':
  const session = event.data.object;
  const { userId, planId } = session.metadata;
  
  // Update Firestore
  const db = getFirestore();
  await updateDoc(doc(db, 'users', userId), {
    subscription: {
      planId: planId,
      status: 'active',
      subscriptionId: session.subscription,
      startDate: new Date(),
    }
  });
  break;
```

## Troubleshooting

- **"Backend API is not available"**: Make sure `VITE_API_URL` points to your deployed API
- **CORS errors**: The API functions now include CORS headers
- **Webhook not working**: Check that `STRIPE_WEBHOOK_SECRET` is set in Vercel

## Quick Test Checklist

- [ ] `.env.local` exists with publishable key
- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Webhook configured in Stripe Dashboard
- [ ] Test payment with test card

---

**Need help?** Check `STRIPE_SETUP.md` for more details.
