# Coupon Code Validation Fix

## Problem
The coupon code field was rejecting valid discount codes (like "FREESHIPPING2026" and "BUYGET") that were displayed in the "AVAILABLE COUPONS" section. The console showed `Available codes: Array(0)`, indicating the discounts array was empty.

## Root Cause
The issue was in `extensions/cart-upsell/assets/modules/discount-manager.js`:

```javascript
// OLD CODE - BUGGY
if (!couponField || (!couponField.enableAutoApply && !couponField.showAllOffers)) {
  return [];  // ❌ Returns empty array if both settings are false
}
```

This meant that if both `enableAutoApply` and `showAllOffers` were disabled, the `loadAvailableDiscounts()` function would return an empty array, preventing any coupon validation.

## Solution

### 1. Fixed `discount-manager.js`
Changed the condition to ALWAYS fetch discounts when the coupon field is enabled:

```javascript
// NEW CODE - FIXED
if (!couponField) {
  return [];  // ✅ Only return empty if coupon field is disabled
}
```

Now discounts are fetched whenever the coupon field feature is enabled, regardless of auto-apply or show-all-offers settings.

### 2. Enhanced `CouponCodeField.tsx`
- Added proper initialization from `availableDiscounts` prop
- Added `useEffect` to update when prop changes
- Added better console logging for debugging
- Improved error messages

### 3. Validation Logic
The component now:
1. **ONLY accepts codes from the available discounts list** (fetched from `/api/available-discounts`)
2. **Rejects all other codes** with message: "Invalid coupon code. Please select from available coupons below."
3. **No fallback API validation** - this ensures only merchant-configured discounts are accepted

## How It Works Now

1. Cart drawer loads → calls `loadAvailableDiscounts()`
2. Discounts are fetched from `/api/available-discounts` endpoint
3. Discounts are passed to `CouponCodeField` component as prop
4. Component validates user input against this list
5. Valid codes (in the list) → Applied ✅
6. Invalid codes (not in list) → Rejected ❌

## Testing
After deploying, verify:
1. Open cart drawer
2. Check console for: `Selldrawer: Loaded available discounts [...]`
3. Type a valid coupon code (e.g., "FREESHIPPING2026")
4. Click Apply → Should work ✅
5. Type an invalid code → Should show error ❌

## Files Changed
- `extensions/cart-upsell/assets/modules/discount-manager.js`
- `app/components/shared/CouponCodeField.tsx`
- Built bundles: `extensions/cart-upsell/assets/cart-drawer.js`
