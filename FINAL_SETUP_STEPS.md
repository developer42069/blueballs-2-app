# Final Setup Steps

Your Blue Balls game application has been built! Follow these steps to get it running:

## ✅ What's Done

The entire SvelteKit application has been created with:
- Complete frontend (all pages, components, layouts)
- Backend API routes (scoring, lives, Stripe integration)
- Database schema (supabase-schema.sql)
- Admin panel
- Documentation

## 🚀 Next Steps to Get Running

### Step 1: Set Up Supabase Database

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `supabase-schema.sql` in your project
4. Copy ALL the contents
5. Paste into Supabase SQL Editor
6. Click **Run** to execute the schema

This will create:
- All tables (profiles, game_scores, chat_messages, friends, affiliates, etc.)
- Security policies (Row Level Security)
- Functions (lives regeneration, ranking, etc.)
- Default settings

### Step 2: Configure Supabase Authentication

1. In Supabase Dashboard, go to **Authentication > Providers**
2. Enable these providers:
   - **Email** (enabled by default)
   - **Google OAuth**:
     - Go to Google Cloud Console
     - Create OAuth 2.0 credentials
     - Add to Supabase
   - **Discord OAuth**:
     - Go to Discord Developer Portal
     - Create application
     - Add OAuth credentials to Supabase

3. Set redirect URLs:
   - Go to **Authentication > URL Configuration**
   - Add: `http://localhost:5173/auth/callback`
   - Add your production URL when ready

### Step 3: Set Up Stripe (For Payments)

1. Go to https://stripe.com and create an account
2. Get your **test mode** API keys from Dashboard
3. Create two products:
   - **BlueBalls Mid**: $2/month recurring
   - **BlueBalls Big**: $10/month recurring
4. Copy the Price IDs (they start with `price_`)
5. Update these in Supabase `system_settings` table:
   ```sql
   UPDATE system_settings SET value = 'price_YOUR_MID_PRICE_ID' WHERE key = 'stripe_mid_price_id';
   UPDATE system_settings SET value = 'price_YOUR_BIG_PRICE_ID' WHERE key = 'stripe_big_price_id';
   ```

### Step 4: Environment Variables

Your `.env` file already exists. Make sure it has these values:

```bash
PUBLIC_SUPABASE_URL=https://onigvijfusxtycronhhm.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_VErHJTXlKRl7vlmaN9JErQ_9jwz6f7j
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_51SG43b7zM8kvkBwkqzsJbv9...
STRIPE_TEST_SECRET_KEY=sk_test_51SG43b7zM8kvkBwkbw5egEtvmhy5TWG...
PUBLIC_APP_URL=http://localhost:5173
```

### Step 5: Run the Development Server

```bash
npm run dev
```

Your app will be available at: **http://localhost:5173**

### Step 6: Create Your Admin Account

1. Open the app in your browser
2. Click "Login / Register"
3. Sign up with email: `cheahboolim@gmail.com`
4. Password: `BooLim!@#888` (or any password you want)
5. After signing up, go back to Supabase SQL Editor
6. Run this query:
   ```sql
   UPDATE profiles
   SET is_admin = true
   WHERE email = 'cheahboolim@gmail.com';
   ```
7. Log out and log back in
8. You can now access `/bolengadmin`

## 🎮 Testing the Application

### Test the Game
1. Go to home page
2. Click "Play Easy" (or Medium/Hard)
3. Click or press Space to play
4. Try to beat your high score!

### Test User Features
- ✅ Register/Login
- ✅ Play game and save scores
- ✅ View leaderboards (will be empty until you have scores)
- ✅ Check dashboard for your stats
- ✅ Try chat (with rate limiting)
- ✅ Invite friends
- ✅ Apply for affiliate program

### Test Admin Features
- ✅ Access `/bolengadmin`
- ✅ View user statistics
- ✅ Edit system settings
- ✅ Manage affiliates
- ✅ Configure email marketing

## 📊 Optional: Generate Test Users

To populate leaderboards with 1000 test users, you can create a script or manually insert test data via Supabase SQL Editor. This makes the leaderboards look more populated.

Example SQL for creating a few test users:
```sql
-- This is just an example - you'd need to expand this for 1000 users
INSERT INTO profiles (id, username, email, country_code, region, lifetime_points, last_30_days_points, high_score_easy, high_score_medium, high_score_hard)
VALUES
(gen_random_uuid(), 'Player1', 'player1@test.com', 'US', 'north_america', 5000, 3000, 50, 75, 100),
(gen_random_uuid(), 'Player2', 'player2@test.com', 'JP', 'asia', 4500, 2800, 45, 70, 95);
```

## 🚀 Deployment to Cloudflare Pages

When ready to deploy:

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Follow the instructions in `DEPLOYMENT.md`

## 🎉 You're All Set!

Your Blue Balls game is now ready to play! Here's what you have:

### Pages
- **Home** (`/`) - Landing page
- **Game** (`/game/easy`, `/game/medium`, `/game/hard`) - Play the game
- **Leaderboard** (`/leaderboard`) - Global and regional rankings
- **Dashboard** (`/dashboard`) - Player stats and progression
- **Profile** (`/profile/[id]`) - Public player profiles
- **Chat** (`/chat`) - Real-time global chat
- **Friends** (`/friends`) - Friend system with invites
- **Affiliate** (`/affiliate`) - BB Club affiliate program
- **Subscribe** (`/subscribe`) - Membership tiers and payment
- **Settings** (`/settings`) - User settings
- **Admin** (`/bolengadmin`) - Admin panel

### Features Implemented
✅ Three game difficulty modes
✅ Lives regeneration system
✅ Dual leveling (lifetime + 30-day ranks)
✅ Regional leaderboards (6 regions)
✅ Real-time global chat with rate limiting
✅ Friend invitations with bonuses
✅ Affiliate program (10% commission)
✅ Stripe subscriptions (Mid $2, Big $10)
✅ Profile customization
✅ Dark/Light theme
✅ Admin panel
✅ PWA support
✅ Mobile responsive

## 💡 Tips

- **Test in different browsers** to ensure compatibility
- **Check mobile responsiveness** on your phone
- **Monitor Supabase usage** in the dashboard
- **Set up Stripe webhooks** for production
- **Configure email SMTP** in admin panel for email campaigns

## 🐛 Troubleshooting

**Game not loading?**
- Check browser console for errors
- Ensure Supabase credentials are correct
- Verify database schema was applied

**Can't login?**
- Check Supabase Auth settings
- Verify OAuth redirect URLs
- Check browser console for auth errors

**Payments not working?**
- Ensure Stripe keys are in test mode
- Check Stripe dashboard for errors
- Verify Price IDs in system_settings

**Need help?**
- Check `SETUP_NOTES.md` for detailed setup info
- Review `DEPLOYMENT.md` for deployment guidance
- Check Supabase logs in dashboard
- Review browser developer console

---

**Enjoy your game! 🎮🎉**
