# Blue Balls Game - Setup Notes

## Files Created

### Authentication Pages
1. **src/routes/auth/login/+page.svelte**
   - Login page with Google, Discord, and Email authentication
   - Auto-detects user's country for region assignment
   - Redirects to dashboard after successful login

2. **src/routes/auth/register/+page.svelte**
   - Registration page with OAuth and email options
   - Country selector for region assignment
   - Creates initial profile with free tier settings

3. **src/routes/auth/callback/+page.svelte**
   - OAuth callback handler
   - Creates profile if it doesn't exist
   - Handles authentication code exchange

### Game Components
1. **src/lib/components/GameCanvas.svelte**
   - Core game logic using HTML5 Canvas
   - Flappy Bird-style physics with blue ball and pink obstacles
   - Sound effects (beep tones) with mute button
   - Responsive canvas sizing
   - Difficulty-based game configuration
   - Game over detection and score reporting

2. **src/routes/game/[difficulty]/+page.svelte**
   - Game page wrapper for easy/medium/hard modes
   - Lives tracking and display
   - Score submission to API
   - High score display
   - Guest mode warning for non-logged-in users

### Leaderboard
1. **src/routes/leaderboard/+page.svelte**
   - Regional and global leaderboards
   - Filter by difficulty, region, and timeframe
   - Top 100 players display
   - Real-time rank badges and country codes
   - Highlights current user's position

### Dashboard & Profile
1. **src/routes/dashboard/+page.svelte**
   - Player statistics overview (lives, level, rank, membership)
   - Progress bar to next level
   - High scores for all difficulties
   - Recent games history
   - Quick action links

2. **src/routes/profile/[id]/+page.svelte**
   - Public profile pages
   - View high scores and stats
   - Friend system (add/remove friends)
   - Privacy settings (profile_public field)
   - Social links display

### API Routes
1. **src/routes/api/score/+server.ts**
   - POST endpoint to save game scores
   - Updates player stats (points, level, rank)
   - Deducts lives
   - Checks for high scores
   - Calculates rank progression (blue → silver → gold → platinum → diamond → black)
   - Level calculation: 100 points per level

2. **src/routes/api/lives/regen/+server.ts**
   - POST endpoint to regenerate lives
   - Calculates lives based on time passed
   - Respects lives_per_hour and max_lives limits
   - Updates last_life_regen timestamp

3. **src/routes/api/stripe/create-checkout/+server.ts**
   - Creates Stripe checkout sessions
   - Handles mid ($2/month) and big ($10/month) tier subscriptions
   - Creates/retrieves Stripe customers
   - Redirects to success/cancel URLs

4. **src/routes/api/stripe/webhook/+server.ts**
   - Handles Stripe webhook events
   - Processes subscription creation, updates, and cancellations
   - Updates user membership tiers
   - Adjusts lives based on tier changes
   - Handles payment success/failure events

### Configuration Files
1. **.env.example**
   - Environment variable template
   - Contains all required API keys and configuration

## Important Notes

### Authentication
- The app uses Supabase Auth with OAuth (Google, Discord) and email/password
- Sessions are managed through Supabase client-side
- API routes authenticate using Bearer tokens from Authorization header
- Users must be logged in to save scores and access dashboard

### Game Mechanics
- **Scoring**: Score increases by 1 for each obstacle passed
- **Points**: Score × difficulty multiplier (easy: 1x, medium: 1.5x, hard: 2x)
- **Lives**: Deducted by 1 per game, regenerates based on membership tier
- **Levels**: 100 points = 1 level
- **Ranks**:
  - Blue: 0-499 points
  - Silver: 500-999 points
  - Gold: 1000-1999 points
  - Platinum: 2000-4999 points
  - Diamond: 5000-9999 points
  - Black: 10000+ points

### Membership Tiers
- **Free (BlueBalls)**: 4 lives/hour, max 100 lives
- **Mid (BlueBalls Mid)**: 40 lives/hour, max 1000 lives, $2/month
- **Big (BlueBalls Big)**: Unlimited lives, $10/month, no ads

### Database Schema Required
The following Supabase tables are expected:
- `profiles` - User profiles with stats
- `game_scores` - Individual game scores
- `friends` - Friend relationships
- `chat_messages` - Global chat (not implemented in these files)
- `affiliates` - Affiliate program (not implemented in these files)
- `system_settings` - System configuration (not implemented in these files)

### Stripe Setup Required
1. Create a Stripe account
2. Create two subscription products:
   - Mid tier: $2/month (recurring)
   - Big tier: $10/month (recurring)
3. Copy the price IDs to .env file
4. Set up webhook endpoint pointing to: `your-domain.com/api/stripe/webhook`
5. Add webhook secret to .env file

### Environment Variables
Copy `.env.example` to `.env` and fill in:
- Supabase URL and anon key
- Stripe secret key and webhook secret
- Stripe price IDs for each tier

### Sound Effects
The GameCanvas component currently uses Web Audio API to generate simple beep sounds:
- Jump: 400Hz tone
- Score: 600Hz tone
- Die: 200Hz sawtooth wave

For production, you can replace these with actual audio files by:
1. Adding audio files to `static/sounds/`
2. Updating the `playSound()` function to use `new Audio()` instead

### Next Steps
1. Set up Supabase database with proper schema
2. Configure OAuth providers (Google, Discord) in Supabase dashboard
3. Set up Stripe products and webhooks
4. Test authentication flow
5. Test game mechanics and score submission
6. Implement remaining pages (chat, friends, affiliate, settings, etc.)
7. Add real sound effect files
8. Set up PWA configuration for mobile app installation
9. Deploy to production (Cloudflare Pages recommended based on adapter config)

### Known Limitations
- Lives regeneration is manual (requires API call), could be automated with a cron job
- No admin panel implemented (routes exist but pages not created)
- Chat and friends features have routes but no pages yet
- Affiliate system has data structure but no UI yet
- Sound effects are placeholder beeps, not real audio files

### Testing Checklist
- [ ] Register new user with email
- [ ] Login with OAuth (Google/Discord)
- [ ] Play game on all difficulties
- [ ] Score submission and lives deduction
- [ ] Level progression
- [ ] Rank progression
- [ ] Leaderboard filtering
- [ ] Profile viewing
- [ ] Stripe checkout flow
- [ ] Webhook processing
- [ ] Lives regeneration

## File Summary
Total files created: 15
- Pages: 8
- Components: 1
- API Routes: 4
- Configuration: 2

All files follow SvelteKit conventions and use TypeScript for type safety.
