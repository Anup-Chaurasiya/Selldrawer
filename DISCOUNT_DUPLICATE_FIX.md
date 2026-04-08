# Discount Activation Fixes

## Issues Fixed

### 1. Duplicate Discount Title Error
**Error**: "Title must be unique for automatic discount"

**Root Cause**: The discount creation logic had a check for existing discounts, but it was using the wrong GraphQL query (`automaticDiscountNodes` instead of `discountNodes`), causing it to not properly detect existing discounts.

**Solution**:
- Changed GraphQL queries from `automaticDiscountNodes` to `discountNodes` 
- Updated field access from `automaticDiscount` to `discount`
- Enhanced logging to show actual discount titles
- Added fallback logic to handle duplicate errors gracefully
- When a duplicate error occurs, the system now queries for the existing discount and returns its ID instead of failing

### 2. Storefront API Token Permission Error
**Error**: "Access denied for storefrontAccessTokenCreate field"

**Root Cause**: The app doesn't have the required Shopify API scopes to create Storefront Access Tokens.

**Solution**:
- Changed `createStorefrontAccessToken` to return `null` instead of throwing errors when permissions are missing
- Added graceful error handling with console warnings instead of crashes
- Made `ensureStorefrontAccessToken` return `null` when token creation fails
- The app now continues to function even without Storefront API tokens

### 3. Prisma AppSettings Upsert Error
**Error**: "Invalid 'prisma.appSettings.upsert()' invocation: Argument 'id' is missing"

**Root Cause**: The `AppSettings` model has `id` as the primary key, but the upsert operation wasn't providing the `id` field in the `create` block. Additionally, there was inconsistency between using `crypto.randomUUID()` and `shop` as the id value.

**Solution**:
- Updated upsert to include `id: shop` in the create block
- Changed initial create to use `shop` as id instead of `crypto.randomUUID()` for consistency
- Added `updatedAt: new Date()` to both create and update operations
- Since `shop` is unique and used in the `where` clause, using it as the id ensures consistency

## Files Modified

1. `app/utils/fbt-discount.server.ts`
   - Changed `automaticDiscountNodes` to `discountNodes` in queries
   - Updated field access from `automaticDiscount` to `discount`
   - Improved duplicate discount detection
   - Added fallback query when duplicate error occurs
   - Enhanced logging for debugging

2. `app/utils/storefrontToken.server.ts`
   - Changed return type from `string` to `string | null`
   - Added graceful error handling for permission errors
   - Wrapped token creation in try-catch with proper logging

3. `app/routes/app._index.tsx`
   - Added `id: shop` to the upsert create block
   - Changed initial create to use `shop` as id instead of `crypto.randomUUID()`
   - Added `updatedAt: new Date()` to both create and update operations

## Testing

After these changes:
1. Click "Activate Automatic Discounts" button
2. The system should:
   - Detect existing "Selldrawer Automatic Discounts" if present
   - Create a new discount if none exists
   - Handle duplicate errors gracefully
   - Save the discount activation status to the database

## Next Steps (Optional)

If you need Storefront API functionality, you can:
1. Add these scopes to `shopify.app.toml`:
   ```toml
   scopes = "...,unauthenticated_read_product_listings,unauthenticated_write_checkouts"
   ```
2. Redeploy the app
3. Ask merchants to reinstall/reauthorize the app with new permissions
