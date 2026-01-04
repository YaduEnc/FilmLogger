# 🚀 Vercel Deployment Setup for Stripe

Since you've already deployed to Vercel, follow these steps to add Stripe integration:

## Step 1: Add Environment Variables in Vercel

1. **Go to your Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your FilmLogger project**
3. **Go to Settings → Environment Variables**
4. **Add these environment variables:**

### Required Variables:

```
STRIPE_SECRET_KEY
```
Value: `sk_test_...` (your secret key from Stripe Dashboard - starts with `sk_test_`)

```
VITE_STRIPE_PUBLISHABLE_KEY
```
Value: `pk_test_...` (your publishable key from Stripe Dashboard - starts with `pk_test_`)

### Optional (for webhooks later):

```
STRIPE_WEBHOOK_SECRET
```
Value: `whsec_...` (you'll get this after setting up webhooks)

5. **Select environments**: Make sure to add these to:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (optional)

6. **Click "Save"**

## Step 2: Redeploy Your Project

After adding environment variables, you need to redeploy:

### Option A: Automatic Redeploy (Recommended)
1. **Push your latest code** (if you haven't already):
   ```bash
   git push origin main
   ```
2. Vercel will automatically detect the push and redeploy with new environment variables

### Option B: Manual Redeploy
1. Go to your project in Vercel Dashboard
2. Click on **"Deployments"** tab
3. Click the **"..."** menu on the latest deployment
4. Select **"Redeploy"**
5. Check **"Use existing Build Cache"** (optional)
6. Click **"Redeploy"**

## Step 3: Verify API Routes Are Working

After redeployment, test your API endpoint:

1. **Get your Vercel URL** (e.g., `https://your-project.vercel.app`)
2. **Test the API endpoint** (you can use curl or browser):
   ```
   https://your-project.vercel.app/api/create-checkout-session
   ```
   It should return an error about missing fields (which is expected - it means the route is working!)

## Step 4: Test Payment Flow

1. **Visit your deployed site**: `https://your-project.vercel.app`
2. **Navigate to**: `/membership` or `/checkout/pro` or `/checkout/legend`
3. **Click "Complete Order"**
4. **Use Stripe test card**:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

## Step 5: Set Up Stripe Webhooks (After Testing)

Once payments are working:

1. **Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)**
2. **Click "Add endpoint"**
3. **Enter your webhook URL**:
   ```
   https://your-project.vercel.app/api/webhook
   ```
4. **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. **Copy the webhook signing secret** (starts with `whsec_...`)
6. **Add it to Vercel environment variables** as `STRIPE_WEBHOOK_SECRET`
7. **Redeploy** again

## Troubleshooting

### ❌ "Backend API is not available"
- **Check**: Environment variables are set in Vercel
- **Check**: Project has been redeployed after adding variables
- **Check**: API routes are accessible at `/api/create-checkout-session`

### ❌ "STRIPE_SECRET_KEY environment variable is required"
- **Solution**: Make sure `STRIPE_SECRET_KEY` is added in Vercel Dashboard
- **Solution**: Redeploy after adding the variable

### ❌ CORS Errors
- **Solution**: The API routes already include CORS headers, but if issues persist, check Vercel function logs

### ❌ API Route Returns 404
- **Check**: The `/api` folder is in the root of your project
- **Check**: Files are named correctly (`create-checkout-session.js`, `webhook.js`)
- **Check**: Vercel has detected the API routes (check deployment logs)

## Quick Checklist

- [ ] Added `STRIPE_SECRET_KEY` to Vercel environment variables
- [ ] Added `VITE_STRIPE_PUBLISHABLE_KEY` to Vercel environment variables
- [ ] Redeployed the project
- [ ] Tested API endpoint is accessible
- [ ] Tested payment flow with test card
- [ ] Set up webhooks (optional, for production)

---

**Your API routes are automatically available at:**
- `https://your-project.vercel.app/api/create-checkout-session`
- `https://your-project.vercel.app/api/webhook`

No need to set `VITE_API_URL` - the frontend uses relative paths that work on the same domain! 🎉
