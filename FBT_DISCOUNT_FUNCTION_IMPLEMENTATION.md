# FBT Discount Function Implementation

## Overview

I've successfully created a Shopify Discount Function extension for your FBT (Frequently Bought Together) feature. This replaces the previous approach of creating automatic discounts via the Admin API with a more efficient, scalable solution.

## What Changed

### 1. **New Discount Function Extension** (`extensions/fbt-discount`)
   - Created a Rust-based Shopify Function that automatically applies discounts to FBT bundle products
   - The function reads discount configuration from line item properties (`_fbt_bundle_id`, `_fbt_discount_type`, `_fbt_discount_value`)
   - Supports both PERCENTAGE and FIXED amount discounts
   - Automatically groups cart lines by bundle ID and applies appropriate discounts

### 2. **Simplified Backend Logic** (`app/utils/fbt-discount.server.ts`)
   - Removed the complex per-rule automatic discount creation
   - Now only creates a single function-based discount that applies to all FBT bundles
   - Much simpler and more maintainable

### 3. **Updated FBT Routes** (`app/routes/app.fbt.tsx`)
   - Removed automatic discount creation/deletion logic from add-rule, update-rule, and delete-rule actions
   - Now only stores discount configuration (discountType and discountValue) in the database
   - The discount function reads from line item properties instead

### 4. **Database Changes**
   - Created migration to remove `discountCode` field from FBTRule table
   - Updated comments to reflect new function-based approach

### 5. **Frontend Widget** (`extensions/cart-upsell/assets/modules/fbt-widget-entry.js`)
   - No changes needed! The widget already adds the correct line item properties when adding FBT bundles to cart
   - Properties include: `_fbt_bundle_id`, `_fbt_rule_id`, `_fbt_discount_type`, `_fbt_discount_value`, `_fbt_product_count`

## How It Works

### Old Approach (Removed)
1. Admin creates an FBT rule with products and discount settings
2. Backend creates a Shopify automatic discount for each rule
3. Complex logic to manage multiple discounts
4. Had to delete and recreate discounts when rules changed

### New Approach (Implemented)
1. Admin creates an FBT rule with products and discount settings
2. Backend stores discount configuration in database only
3. When customer adds FBT bundle to cart, line item properties are set
4. **Discount function** reads these properties and automatically applies the discount
5. One function handles ALL FBT bundles - no per-rule discount management

## Installation Steps

### Prerequisites
To build and deploy the discount function, you need Rust/Cargo installed:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Add WASM target
rustup target add wasm32-unknown-unknown
```

### Build and Deploy

1. **Build the function:**
   ```bash
   npx shopify app function build
   ```

2. **Deploy to Shopify:**
   ```bash
   npx shopify app deploy
   ```

3. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Create the function discount (one-time):**
   You'll need to create a single automatic discount that uses this function. Run this in your app:
   
   ```typescript
   import { createFBTFunctionDiscount } from './app/utils/fbt-discount.server';
   
   // In your setup or FBT configuration, call:
   await createFBTFunctionDiscount(admin, shop);
   ```

## Benefits

1. **✅ No More Discount Management**: No need to create/delete Shopify discounts for each FBT rule
2. **✅ Scalable**: One function handles unlimited FBT bundles
3. **✅ Automatic**: Discounts are calculated and applied automatically at checkout
4. **✅ Code-Free Updates**: Changing discount values doesn't require updating Shopify discounts
5. **✅ Performance**: Faster rule creation/updates since no API calls to create discounts
6. **✅ Reliable**: Line item properties ensure bundles are always correctly identified

## Testing

Once deployed, test the FBT discount function:

1. Create an FBT rule with a discount (e.g., 10% off)
2. Add the FBT bundle products to cart
3. Go to checkout
4. Verify the discount is automatically applied
5. Check the cart for line items with `_fbt_bundle_id` properties

## Files Modified

### Created:
- `/extensions/fbt-discount/` - Entire discount function extension
- `/prisma/migrations/drop_fbt_discount_code/migration.sql` - Database migration

### Modified:
- `/app/utils/fbt-discount.server.ts` - Simplified discount management
- `/app/routes/app.fbt.tsx` - Removed automatic discount logic
- `/prisma/schema.prisma` - Removed discountCode field (need to update manually)

### No Changes Needed:
- `/extensions/cart-upsell/assets/modules/fbt-widget-entry.js` - Already adds required properties

## Next Steps

1. Install Rust if not already installed
2. Build the function with `npx shopify app function build`
3. Deploy with `npx shopify app deploy`
4. Run database migrations
5. Create the function-based discount (one-time setup)
6. Test FBT bundles to ensure discounts apply automatically
7. Remove any old automatic discounts that were previously created

## Important Notes

- ⚠️ After deploying, any existing FBT rules will continue to work but won't create new discounts
- ⚠️ Old automatic discounts won't be automatically deleted - you may want to clean these up manually
- ⚠️ The discount function must be deployed and active for discounts to apply
- ✅ Line item properties drive everything - no need to manage Shopify discounts anymore!

## Troubleshooting

### Function not applying discounts?
1. Check if the function is deployed: `npx shopify app function list`
2. Verify the automatic discount is created and active in Shopify admin
3. Check cart line item properties include `_fbt_bundle_id`, `_fbt_discount_type`, and `_fbt_discount_value`

### Build errors?
1. Ensure Rust is installed: `cargo --version`
2. Ensure WASM target is added: `rustup target list | grep wasm32-unknown-unknown`
3. Check function logs: `npx shopify app function logs`

---

**Need Help?** The discount function code is well-commented. Check:
- `extensions/fbt-discount/src/run.rs` - Main discount logic
- `extensions/fbt-discount/src/run.graphql` - Input query
- `app/utils/fbt-discount.server.ts` - Function management
