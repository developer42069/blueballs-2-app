# Stripe Test Mode Setup Instructions

## Step 1: Get Your Test API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key" to see it

3. Copy both keys

## Step 2: Create Test Products

1. Switch to Test Mode in Stripe Dashboard (toggle in top-right)
2. Go to Products → Create Product
3. Create "BlueBalls Mid (Test)":
   - Name: `BlueBalls Mid`
   - Description: `Mid-tier subscription for Blue Balls - 1,000 lives every 24 hours`
   - Price: `$2.00 USD` / month (recurring)
   - Copy the Price ID (starts with `price_test_`)

4. Create "BlueBalls Big (Test)":
   - Name: `BlueBalls Big`
   - Description: `Unlimited Lives`
   - Price: `$10.00 USD` / month (recurring)
   - Copy the Price ID (starts with `price_test_`)

## Step 3: Setup Test Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://blueballs.lol/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Click on your newly created endpoint
7. Click "Reveal" under "Signing secret"
8. Copy the webhook secret (starts with `whsec_`)

## Step 4: Add to .env File

Add these lines to your `.env` file:

```env
# Stripe Test Mode Keys
STRIPE_TEST_SECRET_KEY=sk_test_your_key_here
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_TEST_PRICE_ID_MID=price_test_your_mid_price_id
STRIPE_TEST_PRICE_ID_BIG=price_test_your_big_price_id
STRIPE_TEST_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here
```

## Step 5: Setup Live Webhook (If Not Already Done)

1. Go to https://dashboard.stripe.com/webhooks (make sure you're in LIVE mode)
2. Click "Add endpoint"
3. Set endpoint URL: `https://blueballs.lol/api/stripe/webhook`
4. Select the same events as test mode
5. Click "Add endpoint"
6. Copy the webhook secret for live mode
7. Add to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here
```

## Step 6: Test Cards

Use these test cards when in test mode:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

Use any future expiry date (e.g., 12/34) and any 3-digit CVC.

## Important Notes

- Test and Live mode are COMPLETELY SEPARATE
- Test products won't appear in live mode
- Test subscriptions won't charge real money
- You need SEPARATE webhooks for test and live mode
- Always verify you're in the correct mode before testing
- The webhook handler automatically detects test/live mode based on admin panel toggle
