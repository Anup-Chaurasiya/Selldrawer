# Milestone Auto-Discount Implementation

## Overview
This document describes the implementation of automatic Shopify discount code generation for Cart Milestone Rewards.

## What Changed

### 1. Database Schema (`prisma/schema.prisma`)
- Added `shopifyDiscountId` field to `CartMilestone` model to store the Shopify discount node ID
- This allows us to track and manage discounts created in Shopify

### 2. New Utility Module (`app/utils/shopify-discount.server.ts`)
Created a comprehensive utility module for managing Shopify discounts:

**Functions:**
- `generateDiscountCode()` - Generates unique discount codes with timestamp and random string
- `createMilestoneDiscount()` - Main function that creates appropriate discount based on reward type
- `updateMilestoneDiscount()` - Updates discount by deleting old and creating new
- `deleteShopifyDiscount()` - Removes discount from Shopify
- `createFreeShippingDiscount()` - Creates free shipping discount
- `createPercentageDiscount()` - Creates percentage-based discount
- `createFixedDiscount()` - Creates fixed amount discount
- `createGiftDiscount()` - Creates 100% off discount for gift variants

**Discount Types Supported:**
- `free_shipping` → Free shipping discount
- `discount_percentage` → Percentage discount on entire order
- `discount_fixed` → Fixed amount discount
- `gift_wrapping` → 100% discount on specific gift product variants

### 3. Updated Milestone Route (`app/routes/app.cart-drawer_.milestones.tsx`)

**Changes to Actions:**

**Add Milestone:**
- Removed manual discount code input
- Auto-generates unique discount code
- Creates corresponding Shopify discount via Admin API
- Stores both `discountCode` and `shopifyDiscountId` in database

**Update Milestone:**
- Retrieves existing `shopifyDiscountId`
- Deletes old Shopify discount
- Creates new discount with updated configuration
- Updates database with new discount code and ID

**Delete Milestone:**
- Retrieves `shopifyDiscountId`
- Deletes discount from Shopify
- Deletes milestone from database

**UI Changes:**
- Removed "Discount Code" input field from modal
- Added informational banner explaining auto-generation
- Removed `discountCode` from form state
- Updated validation to not require discount code input

### 4. Shopify App Configuration

**Updated Scopes:**
- `shopify.app.toml` - Added `write_discounts` scope
- `shopify.app.prod.toml` - Added `write_discounts` scope

This allows the app to create, update, and delete discount codes in Shopify.

### 5. Database Migration
Created migration `20251202100000_add_shopify_discount_id` to add the new field.

## How It Works

### Creating a Milestone:
1. Merchant fills out milestone form (title, target amount, reward type, etc.)
2. System auto-generates unique discount code (e.g., `MILESTONE_ABC123_XYZ789`)
3. System creates corresponding Shopify discount via GraphQL Admin API
4. Discount code and Shopify discount ID are stored in database
5. Milestone is saved and ready to use

### Updating a Milestone:
1. Merchant edits milestone configuration
2. System retrieves old `shopifyDiscountId`
3. Old discount is deleted from Shopify
4. New discount is created with updated configuration
5. Database is updated with new discount code and ID

### Deleting a Milestone:
1. Merchant deletes milestone
2. System retrieves `shopifyDiscountId`
3. Discount is deleted from Shopify
4. Milestone is deleted from database

### At Checkout:
- Cart drawer continues to use `milestone.discountCode` internally
- Checkout button redirects to `/checkout?discount=<discountCode>`
- Shopify applies the discount automatically
- **No changes to existing checkout flow**

## What Stayed the Same

✅ Milestone detection logic  
✅ Gift auto-add/remove logic  
✅ Locked/unlocked UI states  
✅ Progress bar calculations  
✅ Checkout button override (`/checkout?discount=CODE`)  
✅ Frontend cart drawer behavior  
✅ API endpoint (`/api/milestones`)  

## Benefits

1. **Simplified UX** - Merchants don't need to manually create discount codes
2. **Consistency** - Discounts are always properly configured
3. **Automation** - Discount creation/deletion is automatic
4. **Error Prevention** - No risk of typos or missing discounts
5. **Maintenance** - System keeps discounts in sync with milestones

## Technical Notes

- Discount codes are generated with format: `MILESTONE_<timestamp>_<random>`
- All discounts are created with no expiry date
- Discounts apply to all customers (no targeting restrictions)
- For gift rewards, 100% discount is applied to specific variants
- Old discounts are cleaned up when milestones are updated/deleted

## Testing Checklist

- [ ] Create milestone with free shipping reward
- [ ] Create milestone with percentage discount
- [ ] Create milestone with fixed discount
- [ ] Create milestone with gift reward
- [ ] Update existing milestone
- [ ] Delete milestone
- [ ] Verify discount appears in Shopify admin
- [ ] Test checkout flow with generated discount code
- [ ] Verify discount is applied correctly at checkout
- [ ] Test with multiple milestones
- [ ] Verify old discounts are cleaned up on update/delete

## Migration Instructions

1. Apply database migration to add `shopifyDiscountId` field
2. Regenerate Prisma client
3. Deploy updated code
4. Existing milestones will continue to work with their manual discount codes
5. New/updated milestones will use auto-generated discounts

