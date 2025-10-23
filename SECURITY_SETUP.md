# Security Setup Guide

This guide covers additional security configurations that cannot be applied via database migrations.

## 🔐 Enable Leaked Password Protection

Supabase Auth can check passwords against the HaveIBeenPwned database to prevent users from using compromised passwords.

### How to Enable:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/onigvijfusxtycronhhm

2. **Open Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Policies" or "Settings"

3. **Enable Password Protection**
   - Look for "Password Protection" or "Security" section
   - Enable "Check passwords against HaveIBeenPwned"
   - This option may also be called "Leaked Password Protection"

4. **Save Changes**
   - Click "Save" or "Update"

### What This Does:

- ✅ Prevents users from creating accounts with compromised passwords
- ✅ Checks against 600+ million leaked passwords from HaveIBeenPwned.org
- ✅ Improves overall account security
- ✅ No performance impact (checked only during signup/password change)

### Alternative (If not available in UI):

If the option isn't visible in the dashboard, you can enable it via the Supabase Management API:

```bash
curl -X PATCH 'https://api.supabase.com/v1/projects/onigvijfusxtycronhhm/config/auth' \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION": true,
    "PASSWORD_MIN_LENGTH": 8,
    "SECURITY_PASSWORD_REQUIRED_CHARACTERS": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    "SECURITY_PASSWORD_CHECKS": ["haveibeenpwned"]
  }'
```

Note: Replace `YOUR_SUPABASE_ACCESS_TOKEN` with your actual access token from the Supabase dashboard.

---

## 📊 Security Checklist

### Database Security (✅ Completed via Migrations)
- [x] Row Level Security enabled on all tables
- [x] Admin-only access to system_settings
- [x] User data isolation (users can only access their own data)
- [x] Function search_path security (prevents injection attacks)
- [x] Affiliate financial data protection
- [x] Email campaign protection

### Auth Security (Manual Setup Required)
- [ ] Leaked password protection enabled
- [ ] MFA/2FA enabled (optional, for admin accounts)
- [ ] Email verification required
- [ ] Password complexity requirements set

### Application Security
- [x] Stripe webhook signature verification
- [x] Session validation on sensitive endpoints
- [x] R2 upload authentication
- [x] API route authentication with Bearer tokens

---

## 🔒 Security Best Practices

### For Admin Accounts:
1. Use strong, unique passwords
2. Enable MFA/2FA if available
3. Regularly review system_settings changes
4. Monitor affiliate payouts for anomalies

### For Production Deployment:
1. Ensure all environment variables are marked as "secret"
2. Never commit `.env` file to git
3. Use separate Stripe test/live webhooks
4. Regularly review Supabase audit logs

### Regular Maintenance:
1. Run `get_advisors` security checks monthly
2. Review and update RLS policies as features are added
3. Keep Supabase libraries up to date
4. Monitor for new security advisories

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [Supabase Auth Security](https://supabase.com/docs/guides/auth/password-security)
- [PostgreSQL Function Security](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
