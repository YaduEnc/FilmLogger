# Stripe Webhook Setup Guide

## Step 1: Get Your Vercel Deployment URL

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **FilmLogger** project
3. Copy your deployment URL (e.g., `https://cine.yaduraj.me` or `https://your-project.vercel.app`)

## Step 2: Configure Webhook in Stripe Dashboard

1. **Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)**
2. **Click "Add endpoint"**
3. **Enter your webhook URL:**
   ```
   https://your-vercel-url.com/api/webhook
   ```
   Replace `your-vercel-url.com` with your actual Vercel URL

4. **Select events to listen to:**
   - ✅ `checkout.session.completed` - When payment succeeds
   - ✅ `customer.subscription.updated` - When subscription changes
   - ✅ `customer.subscription.deleted` - When subscription is cancelled
   - ✅ `invoice.payment_failed` - When payment fails

5. **Click "Add endpoint"**

## Step 3: Get Webhook Signing Secret

1. After creating the webhook, click on it
2. Find the **"Signing secret"** section
3. Click **"Reveal"** or **"Click to reveal"**
4. Copy the secret (starts with `whsec_...`)

## Step 4: Add Webhook Secret to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **FilmLogger** project
3. Go to **Settings → Environment Variables**
4. Click **"Add New"**
5. Add:
   - **Key**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_...` (paste the secret you copied)
   - **Environments**: ✅ Production, ✅ Preview
6. Click **"Save"**

## Step 5: Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Select **"Redeploy"**
4. Wait for deployment to complete

## Step 6: Test the Webhook

1. Make a test payment on your site
2. Go to **Stripe Dashboard → Webhooks**
3. Click on your webhook endpoint
4. Check the **"Events"** tab - you should see events being received
5. Check **Vercel Function Logs** to see if the webhook is processing correctly

## Troubleshooting

### Webhook not receiving events
- ✅ Check webhook URL is correct
- ✅ Check webhook is enabled in Stripe Dashboard
- ✅ Check Vercel deployment is live

### Webhook signature verification failed
- ✅ Make sure `STRIPE_WEBHOOK_SECRET` is set in Vercel
- ✅ Make sure you copied the correct secret (from the right environment - test vs live)
- ✅ Redeploy after adding the secret

### Subscription not updating in Firestore
- ✅ Check Vercel function logs for errors
- ✅ Check that `VITE_FIREBASE_PROJECT_ID` is set in Vercel
- ✅ Verify the webhook is calling `/api/update-subscription` successfully

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activates user subscription in Firestore |
| `customer.subscription.updated` | Updates subscription status |
| `customer.subscription.deleted` | Marks subscription as cancelled |
| `invoice.payment_failed` | Marks subscription as past_due |

---

**Your webhook URL should be:**
```
https://your-vercel-url.com/api/webhook
```

Replace `your-vercel-url.com` with your actual domain!
