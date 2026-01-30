# Customer-Based A/B Testing with Segment Targeting - Implementation Summary

## Overview
Successfully migrated your cart drawer A/B testing system from shop-based to customer-based targeting, with support for both percentage-based rollout and Shopify customer segment targeting.

## Changes Made

### 1. Database Schema Updates (`prisma/schema.prisma`)
- **Added `targetingMode`**: String field to specify "percentage" or "segment" targeting
- **Added `segmentIds`**: String array to store Shopify customer segment IDs
- **Updated rolloutPercentage**: Now only used when targetingMode is "percentage"

```prisma
model CartDrawerVersion {
  targetingMode     String   @default("percentage") // "percentage" or "segment"
  rolloutPercentage Int      @default(0)           // Used when targetingMode is "percentage"
  segmentIds        String[] @default([])          // Used when targetingMode is "segment"
  // ... other fields
}
```

### 2. Version Selection Logic (`app/services/cartDrawerVersions.server.ts`)

#### Updated `getShopCartDrawerVersion()` function:
- **Now accepts**: `shop`, `customerId`, and `customerSegments` parameters
- **Customer ID based**: Uses customer ID instead of shop for deterministic rollout
- **Segment targeting**: Checks if customer belongs to specified segments
- **Backwards compatible**: Falls back to shop if customerId is not provided

```typescript
export async function getShopCartDrawerVersion(
    shop: string, 
    customerId?: string,
    customerSegments?: string[]
): Promise<string>
```

**Selection priority**:
1. Manual shop assignment (if exists)
2. Segment-based targeting (if customer is in specified segments)
3. Percentage-based targeting (deterministic hash of customerId + versionKey)
4. Default version fallback

#### Updated `setVersionRollout()` function:
- **Now accepts**: `versionKey`, `percentage`, `targetingMode`, and `segmentIds`
- **Dual mode support**: Handles both percentage and segment configuration
- **Auto-activation**: Automatically sets isActive based on configuration

### 3. Shopify Integration (`app/services/shopifySegments.server.ts`)
Created new service to interact with Shopify's customer segment API:

- **`getCustomerSegments(request)`**: Fetches all customer segments from Shopify
- **`getCustomerSegmentIds(request, customerId)`**: Gets segments a specific customer belongs to

### 4. API Updates (`app/routes/api.cart-drawer-versions.tsx`)

**Loader**: Now returns customer segments in addition to versions
```typescript
return json({ versions, stats, customerSegments });
```

**Action**: Updated `set-rollout` intent to handle both targeting modes
- Accepts `targetingMode`, `percentage`, and `segmentIds` from form data
- Passes all parameters to `setVersionRollout()`

### 5. UI Modal (`app/components/shared/VersionManagementModal.tsx`)

Complete redesign with:

**Targeting Mode Selection**:
- Radio buttons to choose between "Percentage-based rollout" or "Customer segment targeting"
- Per-version configuration

**Percentage Mode**:
- Quick buttons for 0%, 25%, 50%, 100%
- Progress bar visualization
- Instant apply

**Segment Mode**:
- Multi-select list of available Shopify customer segments
- Segment query preview
- "Apply Segment Targeting" button
- Shows count of currently targeted segments

**Visual Indicators**:
- Badge showing active targeting mode ("Segment Targeting")
- Active/Inactive status badges
- Customer count estimates

## How It Works

### Percentage-Based Rollout
1. Customer visits your store
2. System generates MD5 hash of `customerId + versionKey`
3. Hash is converted to a position (0-99)
4. If position < rolloutPercentage, customer gets that version
5. Same customer always gets the same version (deterministic)

### Segment-Based Targeting
1. Customer visits your store
2. System fetches customer's segment memberships from Shopify
3. Checks if customer belongs to any of the version's target segments
4. If match found, customer gets that version
5. Higher priority versions are checked first

## Usage Instructions

### Setting Up Percentage Rollout
1. Open Version Management Modal
2. Select a version
3. Choose "Percentage-based rollout"
4. Click a percentage button (0%, 25%, 50%, 100%)
5. Changes apply immediately

### Setting Up Segment Targeting
1. Create customer segments in Shopify Admin first
2. Open Version Management Modal
3. Select a version
4. Choose "Customer segment targeting"
5. Select one or more customer segments
6. Click "Apply Segment Targeting"
7. Version becomes active and targets those segments

### Using in Your Code
When loading cart drawer configuration, call with customer information:

```typescript
// Get customer ID from Shopify (e.g., from session or cart)
const customerId = "gid://shopify/Customer/123456";

// Get customer segments (optional, improves accuracy)
const customerSegments = await getCustomerSegmentIds(request, customerId);

// Get the appropriate version
const version = await getShopCartDrawerVersion(
    shop, 
    customerId, 
    customerSegments
);
```

## Benefits

✅ **Per-Customer Targeting**: A/B tests are now user-specific, not shop-specific
✅ **Segment Flexibility**: Target specific customer groups (VIP, new customers, etc.)
✅ **Consistent Experience**: Same customer always sees same version
✅ **Marketing Integration**: Leverage existing Shopify customer segments
✅ **Easy Rollout**: Gradually increase percentage or add segments
✅ **Backwards Compatible**: Still works with shop-based logic if no customer ID

## Important Notes

1. **Customer ID Required**: For customer-based targeting to work, you must pass the Shopify customer ID to `getShopCartDrawerVersion()`

2. **Logged-In Users**: Segment targeting only works for logged-in customers (guest checkouts will fall back to percentage or default)

3. **Segment Sync**: Customer segment membership is fetched from Shopify in real-time

4. **Priority**: Segment targeting is checked before percentage-based targeting

5. **Migration**: Existing percentage rollouts will continue to work, now based on customer ID instead of shop

## Next Steps

To fully integrate this into your cart drawer:

1. **Update cart drawer loader** to pass customer ID and segments
2. **Handle guest users** with appropriate fallback logic
3. **Test segment targeting** with real customer segments
4. **Monitor analytics** to track version performance per segment

## Example Customer Segment Queries
You can create these in Shopify Admin → Customers → Segments:

- **VIP Customers**: `total_spent > 1000`
- **New Customers**: `orders_count = 0`
- **Frequent Buyers**: `orders_count > 5`
- **Email Subscribers**: `email_marketing_consent = 1`
- **Specific Tags**: `customer_tags CONTAINS 'premium'`

These segments can then be selected in the Version Management Modal for targeted rollouts.
