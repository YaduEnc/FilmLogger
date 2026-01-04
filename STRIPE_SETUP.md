# Stripe Payment Integration Setup

## Environment Variables

Create a `.env.local` file in the root directory with:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (your publishable key from Stripe Dashboard)
VITE_API_URL=http://localhost:3000
```

**Backend Environment Variables** (for your API server):
```env
STRIPE_SECRET_KEY=sk_test_... (your secret key from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_... (get from Stripe Dashboard after setting up webhook)
```

## Backend API Setup

You need to create a backend API endpoint to handle Stripe Checkout Session creation. 

### Option 1: Vercel/Netlify Serverless Functions

1. Place the API files in `/api` directory (already created)
2. Deploy to Vercel/Netlify
3. Update `VITE_API_URL` to your deployed API URL

### Option 2: Node.js/Express Backend

Create a simple Express server:

```javascript
// server.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
  // Use code from api/create-checkout-session.js
});

app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  // Use code from api/webhook.js
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Option 3: Firebase Cloud Functions

Deploy as Firebase Functions (see Firebase documentation).

## Stripe Dashboard Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers > Webhooks**
3. Add webhook endpoint: `https://your-api-url.com/api/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the webhook signing secret to your backend `.env`

## Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry date, any CVC

## Plan Configuration

- **Pro Archivist**: ₹199/month
- **Cinema Legend**: ₹499/month

Both are recurring monthly subscriptions.
