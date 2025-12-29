# MOGU Education - Deployment Guide

## Quick Start - Local Development

The website is already running and accessible at:
- **Local**: http://localhost:3000
- **Public URL**: https://3000-ife4zimfunsdxfan09n1m-dfc00ec5.sandbox.novita.ai

### Current Status
✅ All features implemented and tested
✅ Database initialized with sample data
✅ Server running via PM2 (process manager)
✅ All pages functional (Home, About, Services, Standards, Verify, Centers, Contact)
✅ API endpoints working (certificate verification, statistics, search)

## Testing the Website

### 1. Test Certificate Verification

Visit: https://3000-ife4zimfunsdxfan09n1m-dfc00ec5.sandbox.novita.ai/verify

Try these sample certificates:
- **Certificate Number**: `MOGU-2024-001`
- **Holder Name**: `Sarah Johnson`
- **Certificate Number**: `MOGU-2024-004`
- **Holder Name**: `David Kim`

### 2. Browse Accredited Centers

Visit: https://3000-ife4zimfunsdxfan09n1m-dfc00ec5.sandbox.novita.ai/centers

You'll see 3 sample accredited training centers from Canada.

### 3. Explore MOGU Method

Visit: https://3000-ife4zimfunsdxfan09n1m-dfc00ec5.sandbox.novita.ai/standards

Learn about the 4-component accreditation methodology.

## API Testing

### Certificate Verification API
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"certificateNumber":"MOGU-2024-001"}'
```

### Get Statistics
```bash
curl http://localhost:3000/api/stats
```

### Search Certificates
```bash
curl "http://localhost:3000/api/certificates/search?q=Sarah"
```

### Get Accredited Centers
```bash
curl http://localhost:3000/api/centers
```

## Deployment to Production (Cloudflare Pages)

### Prerequisites

Before deploying, you need:
1. ✅ Cloudflare account (https://dash.cloudflare.com)
2. ✅ Cloudflare API Token configured
3. ✅ Domain name (optional, Cloudflare provides free subdomain)

### Step 1: Setup Cloudflare Authentication

**CRITICAL: Call `setup_cloudflare_api_key` before deployment:**

This tool will:
- Configure your Cloudflare API token
- Set up authentication for wrangler commands
- Validate your credentials

If setup fails, you'll need to:
1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Create API Token with "Edit Cloudflare Workers" template
3. Add token in the deployment interface

### Step 2: Create Production D1 Database

```bash
cd /home/user/webapp

# Create production database
npx wrangler d1 create webapp-production

# You'll get output like:
# database_id = "abc123def456..."

# Update wrangler.jsonc with the real database_id
```

Update `wrangler.jsonc`:
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "YOUR_ACTUAL_DATABASE_ID_HERE"
    }
  ]
}
```

### Step 3: Apply Migrations to Production

```bash
# Apply database schema to production
npx wrangler d1 migrations apply webapp-production

# Seed production database (optional)
npx wrangler d1 execute webapp-production --file=./seed.sql
```

### Step 4: Manage Project Name with meta_info

**CRITICAL: Always manage cloudflare_project_name using meta_info:**

```bash
# Read existing project name
meta_info(action="read", key="cloudflare_project_name")

# If no value exists, use "moguedu" as default
# If deployment fails due to duplicate name, try: moguedu-2, moguedu-3, etc.

# Write the chosen name
meta_info(action="write", key="cloudflare_project_name", value="moguedu")
```

### Step 5: Create Cloudflare Pages Project

```bash
# Create Pages project with the name from meta_info
npx wrangler pages project create moguedu \
  --production-branch main \
  --compatibility-date 2024-01-01
```

### Step 6: Deploy to Production

```bash
# Build and deploy
npm run build
npx wrangler pages deploy dist --project-name moguedu
```

You'll receive:
- **Production URL**: https://moguedu.pages.dev
- **Branch URL**: https://main.moguedu.pages.dev

### Step 7: Update Meta Info After Successful Deployment

**REQUIRED: Save the final project name:**

```bash
meta_info(action="write", key="cloudflare_project_name", value="moguedu")
```

### Step 8: Set Environment Variables (Optional)

If you need environment variables:
```bash
npx wrangler pages secret put API_KEY --project-name moguedu
```

### Step 9: Custom Domain (Optional)

```bash
npx wrangler pages domain add moguedu.ca --project-name moguedu
```

## GitHub Deployment

### Setup GitHub Environment

**CRITICAL: Call `setup_github_environment` before any GitHub operations:**

This tool will:
- Configure git credentials globally
- Set up GitHub CLI authentication
- Provide information about available repositories

If setup fails:
1. Go to #github tab to complete authorization
2. Authorize both GitHub App and OAuth
3. Retry setup_github_environment

### Push to GitHub

```bash
cd /home/user/webapp

# After successful setup_github_environment
git remote add origin https://github.com/YOUR_USERNAME/moguedu.git

# For new repository
git push -f origin main

# For existing repository
git push origin main
```

## Maintenance & Management

### PM2 Commands

```bash
# List processes
pm2 list

# View logs (non-blocking)
pm2 logs moguedu --nostream

# Restart service
npm run clean-port
pm2 restart moguedu

# Stop service
pm2 stop moguedu

# Delete from PM2
pm2 delete moguedu
```

### Database Management

```bash
# Reset local database (CAUTION: deletes all data)
npm run db:reset

# Apply new migrations locally
npm run db:migrate:local

# Seed database
npm run db:seed

# Query database locally
npx wrangler d1 execute webapp-production --local --command="SELECT * FROM certificates LIMIT 5"

# Query production database
npx wrangler d1 execute webapp-production --command="SELECT COUNT(*) FROM certificates"
```

### Rebuild and Restart

```bash
cd /home/user/webapp

# Clean port
npm run clean-port

# Rebuild
npm run build

# Restart with PM2
pm2 restart moguedu

# Or start fresh
pm2 delete moguedu
pm2 start ecosystem.config.cjs
```

## Troubleshooting

### Port 3000 Already in Use
```bash
npm run clean-port
# or
fuser -k 3000/tcp
```

### Database Not Found
```bash
# Reset and reinitialize
npm run db:reset
```

### Build Errors
```bash
# Clean and rebuild
rm -rf dist .wrangler
npm run build
```

### PM2 Process Issues
```bash
# Restart PM2
pm2 delete all
pm2 start ecosystem.config.cjs
```

### Cloudflare Authentication Failed
1. Check API token permissions
2. Verify token is not expired
3. Use `npx wrangler whoami` to test

### GitHub Authentication Failed
1. Call `setup_github_environment` again
2. Complete authorization in #github tab
3. Verify both App and OAuth are authorized

## Production Monitoring

### Check Deployment Status
```bash
npx wrangler pages deployment list --project-name moguedu
```

### View Production Logs
```bash
npx wrangler pages deployment tail --project-name moguedu
```

### Check D1 Database Status
```bash
npx wrangler d1 list
```

## URLs Summary

### Development
- Local: http://localhost:3000
- Public: https://3000-ife4zimfunsdxfan09n1m-dfc00ec5.sandbox.novita.ai

### Production (After Deployment)
- Main: https://moguedu.pages.dev
- Branch: https://main.moguedu.pages.dev
- Custom: https://moguedu.ca (if configured)

## Important Files

- `wrangler.jsonc` - Cloudflare configuration
- `ecosystem.config.cjs` - PM2 process configuration
- `src/index.tsx` - Main application with all routes
- `migrations/0001_initial_schema.sql` - Database schema
- `seed.sql` - Sample data
- `package.json` - Scripts and dependencies
- `README.md` - Main documentation
- `DEPLOYMENT.md` - This file

## Next Steps After Deployment

1. ✅ Test all pages on production URL
2. ✅ Verify certificate verification works
3. ✅ Check API endpoints respond correctly
4. ✅ Monitor performance and errors
5. ⏳ Set up custom domain (optional)
6. ⏳ Configure email notifications (future)
7. ⏳ Add admin dashboard (future)
8. ⏳ Implement QR codes for certificates (future)

## Support

For issues or questions:
- Check README.md for general documentation
- Review Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- Hono framework docs: https://hono.dev/

---

**Ready to deploy!** Follow the steps above to move from sandbox to production.
