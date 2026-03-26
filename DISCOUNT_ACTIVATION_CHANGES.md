# Discount Activation Changes - Summary

## Overview
Implemented a one-time discount activation button on the home page that creates a single automatic discount called "Selldrawer Automatic Discounts" which handles all discount types (FBT bundles, milestones, and gift rewards).

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
Added new `AppSettings` model to track discount activation status:

```prisma
model AppSettings {
  id                        String   @id @default(cuid())
  shop                      String   @unique
  discountFunctionActivated Boolean  @default(false)
  discountFunctionId        String?
  discountId                String?
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  @@index([shop])
}
```

**Migration**: `20260325190649_add_app_settings_for_discount_activation`

### 2. Discount Utility (`app/utils/fbt-discount.server.ts`)
- Changed discount title from "FBT Bundle Discount" to **"Selldrawer Automatic Discounts"**
- Updated function detection to look for `product_discount` API type (singular)
- Improved logging for better debugging
- Changed discount to NOT combine with other discounts to prevent conflicts
- Increased query limit from 25 to 50 functions

### 3. Home Page (`app/routes/app._index.tsx`)
Added discount activation functionality:

**Loader Changes:**
- Check `AppSettings` to see if discount is already activated
- Create `AppSettings` record if it doesn't exist
- Pass `discountFunctionActivated` status to the UI

**Action Changes:**
- Added `activate-discount` intent handler
- Calls `getFBTFunctionId()` to verify function exists
- Calls `createFBTFunctionDiscount()` to create the automatic discount
- Updates `AppSettings` with activation status and IDs
- Returns success/error messages

**UI Changes:**
- Added discount activation banner (shown when not activated)
- Added success banner (shown when activated)
- Button to activate with loading state
- Error handling and display

### 4. FBT Page (`app/routes/app.fbt.tsx`)
- Removed "Activate FBT Discount" button
- Replaced with informational banner directing users to home page
- Kept error handling for backward compatibility

## User Flow

### First Time Setup:
1. Merchant installs the app
2. Goes to home page (dashboard)
3. Sees banner: "Activate Automatic Discounts"
4. Clicks "Activate Automatic Discounts" button
5. System creates "Selldrawer Automatic Discounts" in Shopify
6. Banner changes to success state
7. Discount is now active for all features (FBT, milestones, gifts)

### After Activation:
- Home page shows green success banner
- FBT page shows info banner about the discount
- Milestones automatically use the discount
- Gift rewards automatically use the discount
- No need to activate again

## Discount Name
**"Selldrawer Automatic Discounts"**

This single discount handles:
- FBT bundle discounts (based on line item attributes)
- Milestone rewards (free shipping, percentage, fixed, gifts)
- Gift product discounts

## Technical Details

### How It Works:
1. The Shopify Function (`discount-function-rs`) is deployed with the app
2. When activated, an automatic discount is created that uses this function
3. The function reads cart line attributes to determine discounts:
   - `_fbt_bundle_id`: Bundle identifier
   - `_fbt_discount_type`: "PERCENTAGE" or "FIXED"
   - `_fbt_discount_value`: Discount amount
   - `_fbt_bundle_size`: Total items in bundle

### Database Tracking:
- `AppSettings.discountFunctionActivated`: Boolean flag
- `AppSettings.discountFunctionId`: Shopify Function ID
- `AppSettings.discountId`: Automatic Discount ID

## Testing Checklist

- [ ] Fresh install shows activation banner on home page
- [ ] Clicking "Activate" creates discount in Shopify Admin
- [ ] Success banner appears after activation
- [ ] FBT page shows info banner (not activation button)
- [ ] Discount appears in Shopify Admin as "Selldrawer Automatic Discounts"
- [ ] FBT bundles apply discounts correctly
- [ ] Milestones apply discounts correctly
- [ ] Gift rewards apply discounts correctly
- [ ] Reloading page maintains activation state

## Deployment Steps

1. **Deploy the discount function:**
   ```bash
   npm run deploy
   ```

2. **Apply database migration:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Restart the app:**
   ```bash
   npm run build
   npm start
   ```

4. **Test the flow:**
   - Go to home page
   - Click "Activate Automatic Discounts"
   - Verify discount created in Shopify Admin
   - Test FBT bundles, milestones, and gifts

## Benefits

1. **Single Setup**: One-time activation for all discount features
2. **Clear Naming**: "Selldrawer Automatic Discounts" clearly identifies the app
3. **Centralized**: All discount logic in one place
4. **User-Friendly**: Simple button on home page, no confusion
5. **Persistent**: Tracks activation status in database
6. **Flexible**: Works for FBT, milestones, and gift rewards

## Notes

- The discount function must be deployed before activation
- If deployment fails, user sees error message with instructions
- Activation is idempotent (safe to call multiple times)
- Existing discounts are detected and reused
- No manual discount creation needed by merchant
