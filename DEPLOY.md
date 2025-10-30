# Deployment Instructions for Blueballs CF

## Quick Deploy

This project is deployed to **Cloudflare Pages** under the project name `blueballs-cf`.

### 1. Build the Application

```bash
npm run build
```

This creates the production build in `.svelte-kit/cloudflare` directory.

### 2. Deploy to Cloudflare Pages

```bash
npx wrangler pages deploy .svelte-kit/cloudflare --project-name=blueballs-cf
```

## Production URLs

- **Custom Domain**: https://blueballs.lol
- **Pages Domain**: https://blueballs-cf.pages.dev
- **Account**: cheahboolim1991@gmail.com

## Environment Variables

Environment variables are already configured in Cloudflare Pages. To view them:

```bash
npx wrangler pages secret list --project-name=blueballs-cf
```

### Current Environment Variables in Cloudflare:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY_LIVE`
- `STRIPE_SECRET_KEY_TEST`
- `PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE`
- `PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST`
- `STRIPE_PRICE_ID_MID`
- `STRIPE_PRICE_ID_BIG`
- `STRIPE_WEBHOOK_SECRET`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_ENDPOINT`
- `CLOUDFLARE_R2_ACCOUNT_ID`
- `PUBLIC_APP_URL`
- `PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### To Update Environment Variables:

If you need to update a variable:

```bash
# Interactive prompt
npx wrangler pages secret put VARIABLE_NAME --project-name=blueballs-cf

# From file (pipe the value)
echo "your-secret-value" | npx wrangler pages secret put VARIABLE_NAME --project-name=blueballs-cf
```

### Sync All Variables from .env:

If you need to add new variables, add them to `.env` first, then manually set them in Cloudflare using the commands above.

## Complete Deployment Workflow

```bash
# 1. Make your code changes
# 2. Test locally
npm run dev

# 3. Build for production
npm run build

# 4. Deploy to Cloudflare Pages
npx wrangler pages deploy .svelte-kit/cloudflare --project-name=blueballs-cf

# 5. Check deployment
# Visit https://blueballs.lol
```

## Troubleshooting

### If deployment fails:
- Check that `.svelte-kit/cloudflare` directory exists after build
- Ensure you're authenticated: `npx wrangler login`
- Verify project name: `npx wrangler pages project list`

### If environment variables are missing:
- List current variables: `npx wrangler pages secret list --project-name=blueballs-cf`
- Add missing ones using `wrangler pages secret put`

### If auth or payments don't work after deployment:
- Check environment variables are set correctly
- Verify OAuth redirect URIs in Google/Discord consoles
- Check Stripe webhook endpoint is configured
- See `DEPLOYMENT_INSTRUCTIONS.md` for detailed testing checklist

## Notes

- The project uses Cloudflare Pages adapter
- Build output goes to `.svelte-kit/cloudflare`
- Node.js compatibility is enabled in `wrangler.toml`
- Environment variables are encrypted in Cloudflare Pages
