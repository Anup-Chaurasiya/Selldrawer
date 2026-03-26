# Deployment Guide

## Prerequisites

Before deploying, ensure you have:
1. Shopify CLI installed (`npm install -g @shopify/cli`)
2. Authenticated with Shopify (`shopify auth login`)
3. Database migrations applied (`npx prisma migrate deploy`)

## Deployment Steps

### 1. Build the App

```bash
npm run build
```

This builds the Remix app.

### 2. Deploy to Shopify

```bash
npm run deploy
```

Or manually:

```bash
shopify app deploy
```

When prompted:
- **Release a new version?** → Yes (y)
- Review the changes and confirm

### 3. What Gets Deployed

The deployment includes:

1. **App Configuration**
   - Access scopes
   - Application URL
   - Auth settings
   - Webhooks

2. **Extensions**
   - `cart-upsell` - Theme app extension for cart drawer
   - `fbt-discount` - Shopify Function for automatic discounts

### 4. Post-Deployment

After successful deployment:

1. **Verify in Partner Dashboard**
   - Go to Shopify Partner Dashboard
   - Check your app
   - Verify extensions are listed

2. **Test in Development Store**
   - Install/update the app
   - Go to home page
   - Click "Activate Automatic Discounts"
   - Verify discount created in Shopify Admin

3. **Check Shopify Admin**
   - Go to Discounts
   - Look for "Selldrawer Automatic Discounts"
   - Should be Active

## Troubleshooting

### Build Errors

**Error: "Failed to build function"**

The discount function uses a pre-built WASM file. If you see this error:

1. Check that `extensions/discount-function-rs/dist/function.wasm` exists
2. The build script will use the existing WASM file if Javy is not installed
3. If you need to rebuild from source, install Javy:
   ```bash
   # macOS
   brew install javy
   
   # Linux
   curl -L https://github.com/bytecodealliance/javy/releases/latest/download/javy-x86_64-linux -o /usr/local/bin/javy
   chmod +x /usr/local/bin/javy
   ```

**Error: "Flag not specified: allow-updates"**

This happens in non-interactive environments. Run the command interactively in your terminal.

### Deployment Errors

**Error: "Extension not found"**

Make sure you're in the project root directory when running `npm run deploy`.

**Error: "Authentication failed"**

Re-authenticate with Shopify:
```bash
shopify auth logout
shopify auth login
```

### Runtime Errors

**Discount not activating**

1. Check server logs for errors
2. Verify the function was deployed:
   ```bash
   shopify app function list
   ```
3. Check Shopify Admin → Settings → Apps and sales channels → [Your App] → App settings
4. Look for "Shopify Functions" section

**Database errors**

Make sure migrations are applied:
```bash
npx prisma migrate deploy
npx prisma generate
```

## Development vs Production

### Development
```bash
npm run dev
```

This starts the local development server with hot reload.

### Production

For production deployment:

1. Set environment variables in your hosting platform
2. Build the app: `npm run build`
3. Deploy extensions: `npm run deploy`
4. Start the server: `npm start`

## Environment Variables

Required environment variables:

```env
DATABASE_URL=postgresql://...
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_APP_URL=https://your-app-url.com
SCOPES=read_products,write_products,...
```

## Continuous Deployment

For CI/CD pipelines:

```bash
# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Build app
npm run build

# Deploy extensions (requires interactive mode)
# Use Shopify CLI in CI with --force flag
shopify app deploy --force
```

## Rollback

If you need to rollback:

1. Go to Shopify Partner Dashboard
2. Navigate to your app
3. Go to "Versions"
4. Select a previous version
5. Click "Make this the current version"

## Support

If you encounter issues:

1. Check the logs: `npm run dev` (development) or server logs (production)
2. Verify all environment variables are set
3. Check Shopify Partner Dashboard for deployment status
4. Review the error messages carefully

## Next Steps After Deployment

1. Test the discount activation on home page
2. Configure FBT bundles
3. Set up milestones
4. Configure gift rewards
5. Monitor analytics on the dashboard

---

**Important**: Always test in a development store before deploying to production!
