# Shopify Discount Function Fix Guide

## Issue Summary
The Shopify discount function for FBT (Frequently Bought Together) bundles is not showing discounts. This is because:

1. The discount function needs to be properly deployed
2. An automatic discount needs to be created that uses the function
3. The FBT widget needs to pass the correct line item attributes

## Steps to Fix

### Step 1: Deploy the Discount Function

Run the following command to deploy the discount function to Shopify:

```bash
npm run shopify app deploy
```

Or specifically:

```bash
shopify app deploy
```

This will build and deploy the `discount-function-rs` extension to your Shopify store.

### Step 2: Verify Function Deployment

After deployment, verify the function is available:

1. Go to your Shopify Admin
2. Navigate to Settings > Apps and sales channels > [Your App Name] > App settings
3. Look for "Shopify Functions" section
4. You should see "fbt-discount" function listed

### Step 3: Create the Automatic Discount

The automatic discount should be created automatically when you:

1. Go to your app's FBT configuration page
2. Look for a "Setup Discount" or "Activate Discount" button
3. Click it to create the automatic discount

Alternatively, you can trigger it programmatically by calling the setup-discount action in `app/routes/app.fbt.tsx`.

### Step 4: Verify Discount Creation

Check if the discount was created:

1. Go to Shopify Admin > Discounts
2. Look for "FBT Bundle Discount" in the automatic discounts list
3. It should be active and using your app's function

### Step 5: Test the Discount

To test if discounts are working:

1. Add FBT bundle products to cart with the required line item properties:
   - `_fbt_bundle_id`: A unique ID for the bundle (e.g., "bundle_123")
   - `_fbt_discount_type`: Either "PERCENTAGE" or "FIXED"
   - `_fbt_discount_value`: The discount amount (e.g., "10" for 10% or $10)
   - `_fbt_bundle_size`: Total number of items in the bundle

2. The discount should automatically apply at checkout

## Common Issues and Solutions

### Issue: Function not found
**Solution**: Make sure you've deployed the function using `shopify app deploy`

### Issue: Discount not applying
**Solution**: 
- Check that line item attributes are being set correctly
- Verify the discount is active in Shopify Admin
- Check browser console for errors
- Verify all bundle items have the same `_fbt_bundle_id`

### Issue: Wrong discount amount
**Solution**: 
- For percentage discounts, use the percentage value (e.g., "10" for 10%)
- For fixed discounts, use the amount in shop currency (e.g., "100" for $100)

## Code Changes Made

### 1. Updated `app/utils/fbt-discount.server.ts`
- Improved function detection to look for `product_discount` API type
- Added better logging for debugging
- Fixed discount creation to not combine with other discounts (to avoid conflicts)

### 2. Updated `extensions/discount-function-rs/shopify.extension.toml`
- Ensured correct API version (2026-01)
- Verified target is `cart.lines.discounts.generate.run`

### 3. Updated GraphQL Query
- Simplified query to only fetch necessary cart data
- Removed unnecessary `discount.discountClasses` field

## Testing Checklist

- [ ] Function deployed successfully
- [ ] Automatic discount created in Shopify Admin
- [ ] FBT widget adds products with correct line item attributes
- [ ] Discount applies correctly at checkout
- [ ] Discount amount is correct (percentage or fixed)
- [ ] Discount only applies when all bundle items are in cart

## Next Steps

1. Deploy the function: `npm run shopify app deploy`
2. Go to your app's FBT page and click "Setup Discount"
3. Test by adding FBT bundle products to cart
4. Verify discount appears at checkout

## Support

If issues persist:
1. Check server logs for error messages
2. Check browser console for JavaScript errors
3. Verify Shopify Function logs in Partner Dashboard
4. Ensure all line item attributes are being set correctly
