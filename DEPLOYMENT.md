# Deployment Guide for Blue Balls Game

## Prerequisites

1. GitHub account
2. Cloudflare account
3. Supabase project set up
4. Stripe account configured
5. Environment variables ready

## Step 1: Prepare Your Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the entire `supabase-schema.sql` file
4. Paste and execute it in the SQL Editor
5. Verify all tables are created successfully

## Step 2: Configure Supabase Authentication

### Enable OAuth Providers

1. In Supabase Dashboard, go to **Authentication > Providers**

2. **Google OAuth**:
   - Enable Google provider
   - Add your Google OAuth Client ID and Secret
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `https://your-domain.com/auth/callback`

3. **Discord OAuth**:
   - Enable Discord provider
   - Add your Discord OAuth Client ID and Secret
   - Add authorized redirect URIs (same as above)

4. **Email**:
   - Enable Email provider
   - Configure email templates if desired

### Set Redirect URLs

In **Authentication > URL Configuration**:
- Site URL: `https://your-domain.com`
- Redirect URLs: Add all your domains (production + dev)

## Step 3: Configure Stripe

### Create Products

1. Go to Stripe Dashboard > Products
2. Create two products:

**Product 1: BlueBalls Mid**
- Name: BlueBalls Mid
- Price: $2.00 USD
- Billing period: Monthly (recurring)
- Copy the Price ID (starts with `price_`)

**Product 2: BlueBalls Big**
- Name: BlueBalls Big
- Price: $10.00 USD
- Billing period: Monthly (recurring)
- Copy the Price ID (starts with `price_`)

### Update System Settings

In Supabase, update the `system_settings` table:

```sql
UPDATE system_settings
SET value = 'price_xxxxxxxxxxxxx'
WHERE key = 'stripe_mid_price_id';

UPDATE system_settings
SET value = 'price_xxxxxxxxxxxxx'
WHERE key = 'stripe_big_price_id';
```

### Set Up Webhook

1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Add it to your environment variables

## Step 4: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/blueballs-claudecode.git
git push -u origin main
```

## Step 5: Deploy to Cloudflare Pages

### Connect Repository

1. Log in to Cloudflare Dashboard
2. Go to **Workers & Pages > Pages**
3. Click **Create application > Connect to Git**
4. Select your GitHub repository
5. Click **Begin setup**

### Configure Build Settings

- **Build command**: `npm run build`
- **Build output directory**: `.svelte-kit/cloudflare`
- **Root directory**: `/` (leave empty)
- **Framework preset**: SvelteKit

### Add Environment Variables

In Cloudflare Pages > Settings > Environment Variables:

**Production Variables:**
```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_APP_URL=https://your-domain.pages.dev
```

### Deploy

1. Click **Save and Deploy**
2. Wait for the build to complete
3. Your site will be available at `https://your-project.pages.dev`

## Step 6: Set Up Custom Domain (Optional)

1. In Cloudflare Pages, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `blueballs.lol`)
4. Follow DNS configuration instructions
5. Update `PUBLIC_APP_URL` environment variable
6. Update Supabase and Stripe redirect URLs

## Step 7: Create Admin User

1. Sign up on your deployed site with email `cheahboolim@gmail.com`
2. Go to Supabase Dashboard > SQL Editor
3. Run this query:

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'cheahboolim@gmail.com';
```

4. Log out and log back in
5. Access admin panel at `/bolengadmin`

## Step 8: Generate Test Data (Optional)

To populate your database with 1000 test users for realistic leaderboards:

1. Create a script `generate-test-users.ts` in your project
2. Run it locally with database access
3. Or manually insert test data via Supabase SQL Editor

Example query for test users:

```sql
-- This would be a complex script to generate 1000 users
-- You might want to create this as a separate migration script
```

## Step 9: Configure Email Marketing (Optional)

In Admin Panel > System Settings:

1. Add your Brevo SMTP credentials:
   - `brevo_api_key`
   - `brevo_smtp_server`
   - `brevo_smtp_port`
   - `brevo_from_email`
   - `brevo_from_name`

## Step 10: Test Everything

### Test Checklist

- [ ] Home page loads correctly
- [ ] User can register with email
- [ ] User can login with Google OAuth
- [ ] User can login with Discord OAuth
- [ ] Game loads and is playable in all three modes
- [ ] Scores are saved correctly
- [ ] Lives regenerate properly
- [ ] Leaderboards display correctly
- [ ] Global chat works (real-time updates)
- [ ] Friends can be invited
- [ ] Profile pages load correctly
- [ ] Dashboard shows accurate stats
- [ ] Stripe checkout works for Mid tier
- [ ] Stripe checkout works for Big tier
- [ ] Affiliate application works
- [ ] Admin panel is accessible (for admin user)
- [ ] Theme switcher works
- [ ] Mobile responsive design works
- [ ] PWA can be installed

## Monitoring & Maintenance

### Database Maintenance

Set up these cron jobs using Supabase Database Functions or Cloudflare Workers:

1. **Lives Regeneration** (every hour):
```sql
SELECT regenerate_lives();
```

2. **Chat Message Cleanup** (every 3 hours):
```sql
SELECT clean_old_chat_messages();
```

3. **Auto-approve Affiliates** (every hour):
```sql
SELECT auto_approve_affiliates();
```

4. **Update 30-day Ranks** (daily):
```sql
UPDATE profiles SET last_30_days_points = (
  SELECT calculate_30_day_points(id)
);
```

### Stripe Webhooks

Ensure your webhook endpoint is receiving events:
- Check Stripe Dashboard > Developers > Webhooks
- Monitor webhook delivery status
- Check Cloudflare Pages logs for errors

### Supabase Usage

Monitor your Supabase usage:
- Database size
- Storage usage (for profile pictures)
- Realtime connections
- Auth users

## Troubleshooting

### Build Fails
- Check all environment variables are set
- Ensure `@sveltejs/adapter-cloudflare` is installed
- Check build logs for specific errors

### OAuth Not Working
- Verify redirect URLs in Supabase match your domain
- Check OAuth credentials are correct
- Ensure OAuth apps are not in development mode

### Stripe Webhooks Not Working
- Verify webhook URL is correct
- Check webhook signing secret
- Test webhook in Stripe Dashboard
- Check Cloudflare Pages function logs

### Database Connection Issues
- Verify Supabase URL and keys
- Check RLS policies are correct
- Ensure schema was applied correctly

## Security Checklist

- [ ] Environment variables are not committed to Git
- [ ] Stripe keys are in test mode for testing
- [ ] RLS policies are enabled on all tables
- [ ] Admin routes check `is_admin` flag
- [ ] API routes validate authentication
- [ ] Webhook signatures are verified
- [ ] User input is sanitized (especially chat messages)
- [ ] CORS is properly configured

## Performance Optimization

1. **Enable Cloudflare Caching**:
   - Static assets automatically cached
   - Configure cache rules if needed

2. **Optimize Images**:
   - Use WebP format for static images
   - Compress profile pictures on upload

3. **Database Indexing**:
   - Already included in schema
   - Monitor slow queries in Supabase

4. **Lazy Loading**:
   - SvelteKit handles this automatically
   - Code splitting is automatic

## Support & Updates

After deployment:
1. Monitor error logs regularly
2. Keep dependencies updated
3. Review Supabase and Stripe dashboards
4. Collect user feedback
5. Plan feature updates

## Going Live Checklist

Before switching from test mode to production:

- [ ] Switch Stripe to live mode
- [ ] Update all Stripe keys
- [ ] Test live payment flow
- [ ] Update terms of service
- [ ] Update privacy policy
- [ ] Set up customer support email
- [ ] Enable analytics (optional)
- [ ] Test all critical paths one more time
- [ ] Announce launch!

---

**Congratulations! Your Blue Balls game is now live! 🎉**
