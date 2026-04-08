# Unified Discount System Implementation

## Overview

This document outlines the changes made to unify the discount system for FBT bundles, milestones, and free gifts under a single Shopify Discount Function.

## Changes Made

### 1. Admin Page - Discount Verification (✅ COMPLETE)

**File**: `app/routes/app._index.tsx`

- Added `verifyDiscountExists` import
- Updated loader to check if discount actually exists in Shopify
- If discount is deleted in Shopify, the database is automatically updated to reflect this
- Admin page now shows accurate discount status

### 2. Discount Function - GraphQL Schema (✅ COMPLETE)

**File**: `extensions/discount-function-rs/src/cart_lines_discounts_generate_run.graphql`

Added new attributes for milestone and free gift discounts:
- `selldrawerGiftSource`: Identifies the source ("milestone" or "free_gift")
- `selldrawerDiscountType`: Type of discount ("PERCENTAGE", "FIXED", or "FREE")
- `selldrawerDiscountValue`: The discount amount (100 for free items)

### 3. Discount Function - Logic (✅ COMPLETE)

**File**: `extensions/discount-function-rs/src/cart_lines_discounts_generate_run.js`

- Refactored to handle three discount types:
  1. FBT bundles (existing logic preserved)
  2. Milestone rewards (new)
  3. Free gift promotions (new)
- Split into separate functions for clarity:
  - `processFBTBundles()` - Handles FBT bundle discounts
  - `processGiftDiscounts()` - Handles milestone and free gift discounts
- All discounts are now applied through a single Shopify Function

### 4. Discount Verification Utility (✅ COMPLETE)

**File**: `app/utils/fbt-discount.server.ts`

Added `verifyDiscountExists()` function:
- Queries Shopify to check if a discount still exists
- Returns true if discount is ACTIVE, false otherwise
- Used by admin page to sync database with Shopify state

## What Still Needs to Be Done

### Frontend Integration (⚠️ REQUIRED)

The discount function is ready, but the frontend cart code needs to be updated to add the required line item attributes when adding milestone rewards and free gifts to the cart.

**Files to Update**:
- `extensions/cart-upsell/assets/modules/cart-drawer-class.js`
- `extensions/cart-upsell/assets/modules/milestone-manager.js` (if exists)
- Any code that adds gifts/rewards to cart

**Required Changes**:

When adding a milestone reward or free gift to cart, include these properties:

```javascript
{
  properties: {
    '_selldrawer_gift_source': 'milestone', // or 'free_gift'
    '_selldrawer_discount_type': 'PERCENTAGE', // or 'FIXED' or 'FREE'
    '_selldrawer_discount_value': '100' // 100 for free items, or the discount percentage/amount
  }
}
```

**Example for Free Gift (100% off)**:
```javascript
await fetch('/cart/add.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{
      id: variantId,
      quantity: 1,
      properties: {
        '_selldrawer_gift_source': 'milestone',
        '_selldrawer_discount_type': 'FREE',
        '_selldrawer_discount_value': '100'
      }
    }]
  })
});
```

**Example for Milestone Percentage Discount (20% off)**:
```javascript
properties: {
  '_selldrawer_gift_source': 'milestone',
  '_selldrawer_discount_type': 'PERCENTAGE',
  '_selldrawer_discount_value': '20'
}
```

### Migration from Old Discount System (⚠️ RECOMMENDED)

The old system created individual Shopify Automatic Discounts for each milestone/free gift. These should be cleaned up:

1. **Database Migration**: Update existing milestones and free gifts to clear `shopifyDiscountId`
2. **Shopify Cleanup**: Delete old automatic discounts from Shopify admin
3. **Code Cleanup**: Remove or deprecate the old discount creation code in:
   - `app/utils/shopify-discount.server.ts` (functions: `createMilestoneDiscount`, `updateMilestoneDiscount`)
   - `app/routes/app.cart-drawer_.milestones.tsx` (discount creation logic)
   - `app/routes/app.cart-drawer_.free-gifts.tsx` (discount creation logic)

## Testing Checklist

### FBT Bundles
- [ ] Add FBT bundle to cart
- [ ] Verify discount appears at checkout
- [ ] Verify discount message shows correctly
- [ ] Test with percentage discount
- [ ] Test with fixed amount discount

### Milestone Rewards
- [ ] Reach milestone threshold
- [ ] Add milestone reward to cart
- [ ] Verify 100% discount applied (free gift)
- [ ] Verify discount shows at checkout
- [ ] Test with percentage reward
- [ ] Test with fixed amount reward

### Free Gift Promotions
- [ ] Qualify for free gift
- [ ] Add free gift to cart
- [ ] Verify 100% discount applied
- [ ] Verify discount shows at checkout

### Admin Page
- [ ] Activate discount function
- [ ] Verify success message
- [ ] Delete discount in Shopify admin
- [ ] Refresh admin page
- [ ] Verify status updates to "not activated"
- [ ] Reactivate discount
- [ ] Verify it works again

## Deployment Steps

1. **Deploy the discount function**:
   ```bash
   npm run shopify app deploy
   ```

2. **Activate the discount** in the admin page (click "Activate Automatic Discounts")

3. **Update frontend code** to add the required line item attributes

4. **Test thoroughly** using the checklist above

5. **Clean up old discounts** (optional but recommended)

## Benefits of Unified System

1. **Single Discount**: Only one discount in Shopify admin instead of dozens
2. **Easier Management**: All discount logic in one place
3. **Better Performance**: Shopify Functions are faster than multiple automatic discounts
4. **Flexibility**: Easy to add new discount types in the future
5. **Consistency**: All discounts work the same way

## Notes

- The discount function runs at checkout time, not when items are added to cart
- Line item attributes (properties starting with `_`) are preserved through checkout
- The discount function has access to all cart line items and their attributes
- Discounts are applied automatically - no discount codes needed
