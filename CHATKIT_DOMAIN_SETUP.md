# ChatKit Domain Verification Setup

## Error: Domain verification failed

If you see this error:
```
IntegrationError: Domain verification failed for https://your-domain.vercel.app. 
Please register your domain at https://platform.openai.com/settings/organization/security/domain-allowlist.
```

## Solution

You need to register your domain in OpenAI's domain allowlist:

1. **Go to OpenAI Platform Settings:**
   - Visit: https://platform.openai.com/settings/organization/security/domain-allowlist
   - Or navigate: OpenAI Platform → Settings → Organization → Security → Domain Allowlist

2. **Add Your Domain:**
   - Click "Add Domain" or "Add Allowed Domain"
   - Enter your production domain:
     - Current: `v0-modern-e-commerce-website-sigma-seven.vercel.app`
     - Future: `liiratnews.com` (when ready)
   - Also add the root domain: `vercel.app` (if using Vercel preview URLs)

3. **Domain Format:**
   - You can add domains with or without `https://`
   - Examples:
     - `v0-modern-e-commerce-website-sigma-seven.vercel.app`
     - `liiratnews.com`
     - `*.vercel.app` (wildcard for all Vercel preview URLs)

4. **Save and Wait:**
   - Save the changes
   - Wait a few minutes for the changes to propagate
   - Refresh your application

## Important Notes

- **Local Development:** `localhost` and `127.0.0.1` are typically allowed by default
- **Production:** All production domains must be explicitly added
- **Preview URLs:** If using Vercel preview deployments, consider adding a wildcard or the specific preview URL pattern
- **Subdomains:** Each subdomain needs to be added separately, or use a wildcard pattern

## Verification

After adding your domain:
1. Wait 2-5 minutes for propagation
2. Clear your browser cache
3. Refresh the page
4. The ChatKit widget should load without the domain verification error

## Current Production Domain

- **Vercel Preview:** `https://v0-modern-e-commerce-website-sigma-seven.vercel.app`
- **Future Production:** `https://liiratnews.com` (to be configured later)

