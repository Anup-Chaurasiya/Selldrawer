# Cart Milestone Reward System - Complete Implementation Guide

## 🎯 Overview

This is a **fully client-side** Cart Milestone Reward System for Shopify Non-Plus stores. It handles gift products, percentage discounts, fixed discounts, and free shipping rewards using **ONLY discount codes** and client-side JavaScript.

## ✅ Key Features

- **100% Client-Side**: No Shopify Functions, no Draft Orders, no backend price manipulation
- **All Reward Types**: Gift products, percentage discounts, fixed discounts, free shipping
- **Automatic Gift Management**: Auto-add/remove gift products based on cart total
- **Smart Discount Application**: Highest milestone reward is automatically applied
- **Race Condition Handling**: Proper async handling for cart operations
- **Multi-Tab Safe**: Stable behavior across multiple browser tabs

## 🏗️ Architecture

### Database Schema

The `CartMilestone` model now includes:
- `discountCode` (String, required): Shopify discount code for this milestone
- `rewardType` (String): gift_wrapping, discount_percentage, discount_fixed, free_shipping
- `rewardValue` (Decimal): Discount percentage or amount
- `giftProducts` (Relation): Array of gift products for gift rewards

### Client-Side Modules

1. **milestone-reward-manager.js**: Core reward logic
   - Milestone evaluation
   - Gift product management
   - Checkout validation
   - Discount application

2. **cart-drawer-class.js**: Main cart drawer controller
   - Integrates milestone rewards
   - Handles checkout flow
   - Manages cart state

3. **UnifiedCartDrawer.jsx**: React UI component
   - Displays milestone rewards
   - Shows reward indicators

## 📋 Setup Instructions

### Step 1: Database Migration

Run the Prisma migration to add the `discountCode` field:

```bash
npx prisma migrate dev --name add_discount_code_to_milestones
```

### Step 2: Create Discount Codes in Shopify

For each milestone, create a discount code in Shopify Admin:

1. Go to **Discounts** in Shopify Admin
2. Click **Create discount**
3. Choose the appropriate discount type:
   - **Free Shipping**: For free shipping rewards
   - **Percentage**: For percentage discounts (e.g., 10% OFF)
   - **Fixed Amount**: For fixed discounts (e.g., ₹200 OFF)
   - **Any Type**: For gift rewards (the code just needs to exist)

4. Set the discount value and conditions
5. **Important**: Copy the discount code (e.g., `FREESHIP2000`)

### Step 3: Configure Milestones

1. Go to **Cart Drawer > Milestones** in your app
2. Click **Add Milestone**
3. Fill in the form:
   - **Title**: e.g., "FREE Shipping"
   - **Icon**: e.g., 🚚
   - **Target Amount**: e.g., 2000 (in rupees)
   - **Reward Type**: Select the reward type
   - **Discount Code**: Enter the Shopify discount code (REQUIRED)
   - **Gift Products**: (Only for gift rewards) Select up to 3 products

4. Click **Add** to save

### Step 4: Test the Implementation

See the Testing Guide below for comprehensive test cases.

## 🎁 How It Works

### Gift Rewards

1. **Milestone Reached**: When cart total ≥ targetAmount
2. **Gift Auto-Added**: System calls `/cart/add.js` with:
   ```javascript
   properties: {
     _upsellity_gift: 'true',
     _upsellity_milestone_id: 'milestone_id',
     _gift_title: 'Free Gift'
   }
   ```
3. **Cart Total Calculation**: Gifts are excluded from cart total
4. **Milestone Drops**: If cart total falls below threshold, gift is auto-removed
5. **Checkout**: Discount code is applied via `/checkout?discount=CODE`

### Discount Rewards (Percentage, Fixed, Free Shipping)

1. **Milestone Reached**: When cart total ≥ targetAmount
2. **No Cart Modification**: Nothing is added to cart
3. **Checkout**: Discount code is applied via `/checkout?discount=CODE`
4. **Shopify Handles**: Shopify applies the discount at checkout

### Multiple Milestones

- **Highest Wins**: If multiple milestones are unlocked, only the highest one (by targetAmount) is applied
- **Automatic Switching**: As cart total changes, the system automatically switches to the appropriate milestone
- **Gift Cleanup**: Old gifts from lower milestones are removed when higher milestone is reached

## 🔄 Flow Diagram

```
Cart Updated
    ↓
Load Milestones API (/api/milestones)
    ↓
Evaluate Milestones (milestone-reward-manager.js)
    ↓
Calculate Cart Total (excluding gifts)
    ↓
Find Highest Unlocked Milestone
    ↓
┌─────────────────────────────────────┐
│  Is it a Gift Reward?               │
└─────────────────────────────────────┘
         ↓ YES                ↓ NO
    Sync Gifts          Do Nothing
    - Add missing       (Discount applied
    - Remove old         at checkout)
         ↓
    Reload Cart
         ↓
    Render UI
         ↓
User Clicks Checkout
         ↓
Validate Milestone
    ↓
Redirect to /checkout?discount=CODE
```

## 🧪 Testing Guide

### Test Case 1: Cart Below Milestone
**Setup**: Milestone at ₹2000
**Action**: Add product worth ₹1000
**Expected**:
- No reward shown
- No gift in cart
- Checkout goes to `/checkout` (no discount)

### Test Case 2: Cart Reaches Milestone (Gift Reward)
**Setup**: Gift milestone at ₹2000
**Action**: Add products totaling ₹2000+
**Expected**:
- Gift product auto-added to cart
- Gift has `_upsellity_gift: true` property
- Milestone indicator shows "Free gift added"
- Checkout goes to `/checkout?discount=GIFTCODE`

### Test Case 3: Cart Drops Below Milestone
**Setup**: Cart at ₹2500 with gift
**Action**: Remove items, cart drops to ₹1500
**Expected**:
- Gift product auto-removed
- Milestone indicator disappears
- Checkout goes to `/checkout` (no discount)

### Test Case 4: Multiple Milestones
**Setup**: 
- Milestone 1: ₹2000 → Free Shipping (CODE: SHIP2000)
- Milestone 2: ₹5000 → 10% OFF (CODE: SAVE10)
**Action**: Add products totaling ₹5500
**Expected**:
- Only Milestone 2 (highest) is active
- Checkout uses CODE: SAVE10
- Milestone 1 is not applied

### Test Case 5: Gift Reward + Higher Discount
**Setup**:
- Milestone 1: ₹2000 → Free Gift (CODE: GIFT2000)
- Milestone 2: ₹5000 → Free Shipping (CODE: SHIP5000)
**Action**: Cart at ₹5500
**Expected**:
- Gift from Milestone 1 is removed
- Only Milestone 2 discount is applied
- Checkout uses CODE: SHIP5000

### Test Case 6: Manual Coupon vs Milestone
**Setup**: Milestone at ₹2000 → 10% OFF (CODE: SAVE10)
**Action**: User manually applies coupon "SUMMER20"
**Expected**:
- Manual coupon takes priority
- Checkout uses SUMMER20, not SAVE10
- User can remove manual coupon to use milestone

### Test Case 7: Race Condition (Quick Add/Remove)
**Setup**: Milestone at ₹2000 with gift
**Action**: Rapidly add/remove products crossing threshold
**Expected**:
- No duplicate gifts
- No errors in console
- Final state is correct based on cart total

### Test Case 8: Multiple Tabs
**Setup**: Open cart drawer in 2 tabs
**Action**: Add products in Tab 1, switch to Tab 2
**Expected**:
- Tab 2 shows correct milestone state
- No conflicts or duplicate gifts
- Both tabs work independently

### Test Case 9: Checkout Validation
**Setup**: Gift milestone unlocked but gift not yet added
**Action**: Click checkout immediately
**Expected**:
- System shows "Adding your free gift... Please wait."
- Gift is added automatically
- Checkout proceeds after gift is added

### Test Case 10: Invalid Discount Code
**Setup**: Milestone with invalid/expired discount code
**Action**: Reach milestone and checkout
**Expected**:
- Shopify shows error at checkout
- User can still complete purchase without discount

## 🔧 Configuration Options

### Milestone Settings

```javascript
{
  title: "FREE Shipping",              // Display name
  targetAmount: 2000,                   // Threshold in rupees
  rewardType: "free_shipping",          // Type of reward
  rewardValue: null,                    // Discount value (if applicable)
  discountCode: "FREESHIP2000",         // REQUIRED: Shopify discount code
  icon: "🚚",                           // Display icon
  unlockedMessage: "🎉 You've unlocked {reward}!",
  inProgressMessage: "Only {remaining} away from {reward}!",
  showProgressBar: true,
  iconColor: "#3b82f6",
  titleColor: "#1e40af",
  amountColor: "#3b82f6"
}
```

### Gift Product Settings

```javascript
{
  shopifyProductId: "123456789",
  shopifyVariantId: "987654321",       // REQUIRED for cart operations
  title: "Free Sample Product",
  price: 0,                            // Display price (usually 0)
  imageUrl: "https://...",
  handle: "free-sample"
}
```

## 🚨 Important Notes

### Discount Code Requirements

1. **Must Exist in Shopify**: Create the discount code in Shopify Admin BEFORE configuring the milestone
2. **Case Sensitive**: Discount codes are case-sensitive
3. **No Validation**: The app doesn't validate if the code exists (Shopify will show error at checkout if invalid)
4. **All Reward Types**: Even gift rewards need a discount code (can be a dummy code or a small discount)

### Gift Product Requirements

1. **Variant ID Required**: Must have a valid Shopify variant ID
2. **Product Must Exist**: Product must be active in your store
3. **Inventory**: Ensure gift products have sufficient inventory
4. **Price**: Gift products should be priced at ₹0 or low price (discount code can make it free)

### Cart Total Calculation

- **Excludes Gifts**: Cart total for milestone evaluation excludes gift products
- **Includes Discounts**: Uses final line price (after product-level discounts)
- **Currency**: Assumes INR (₹) - modify if using different currency

### Checkout Behavior

1. **Priority Order**:
   - Milestone discount (if unlocked)
   - Manual coupon (if applied)
   - No discount

2. **Shopify Limitations**:
   - Only ONE discount code can be applied at checkout
   - If user has a better manual code, they can use it instead

3. **Gift Products**:
   - Appear as regular line items at checkout
   - Discount code can make them free or discounted

## 🐛 Troubleshooting

### Gift Not Adding

**Symptoms**: Milestone unlocked but gift not in cart
**Causes**:
- Invalid variant ID
- Product out of stock
- Product not active
**Solution**: Check console for errors, verify product exists

### Gift Not Removing

**Symptoms**: Cart drops below threshold but gift remains
**Causes**:
- Gift property not set correctly
- Concurrent operations
**Solution**: Check gift has `_upsellity_gift: true` property

### Discount Not Applied

**Symptoms**: Checkout doesn't have discount code
**Causes**:
- Invalid discount code
- Code expired in Shopify
- Code usage limit reached
**Solution**: Verify code exists and is active in Shopify Admin

### Multiple Gifts

**Symptoms**: Same gift added multiple times
**Causes**:
- Race condition
- Concurrent cart operations
**Solution**: System has `isSyncingGifts` flag to prevent this

### Console Errors

Check browser console for:
- `Upsellity Milestones:` prefixed messages
- Failed API calls to `/api/milestones`
- Cart operation errors

## 📊 API Endpoints

### GET /api/milestones

**Query Parameters**:
- `shop`: Shopify shop domain
- `cartTotal`: Current cart total in rupees
- `cartItems`: JSON string of cart items

**Response**:
```json
{
  "milestones": [
    {
      "id": "milestone_id",
      "title": "FREE Shipping",
      "targetAmount": 2000,
      "rewardType": "free_shipping",
      "discountCode": "FREESHIP2000",
      "status": "unlocked",
      "progress": 100,
      "remaining": 0,
      "message": "🎉 You've unlocked FREE Shipping!",
      "giftProducts": []
    }
  ],
  "progressBarColor": "#3b82f6",
  "allUnlockedMessage": "🎉 All rewards unlocked!"
}
```

## 🎨 UI Components

### Milestone Widget

Shows progress towards milestones with:
- Progress bar
- Milestone icons
- Current status
- Remaining amount

### Reward Indicator

Shows when milestone is unlocked:
- Green badge with checkmark
- Reward description
- Discount code (if not gift)

### Checkout Button

Custom checkout button that:
- Validates milestone
- Ensures gifts are present
- Applies correct discount code
- Handles errors gracefully

## 🔐 Security Considerations

1. **No Price Manipulation**: All prices are handled by Shopify
2. **Discount Codes**: Must be created in Shopify Admin (secure)
3. **Gift Properties**: Use custom properties to mark gifts (can't be exploited)
4. **Validation**: Server-side validation via Shopify's discount system

## 📈 Performance

- **API Calls**: Milestones loaded once per cart update
- **Gift Operations**: Debounced to prevent excessive API calls
- **Rendering**: React components re-render only when necessary
- **Caching**: No caching (always fresh data)

## 🚀 Deployment

1. **Database Migration**: Run Prisma migration
2. **Build Assets**: Rebuild cart drawer assets
3. **Update Theme**: Ensure latest cart-drawer.js is loaded
4. **Test**: Run through all test cases
5. **Monitor**: Check console for errors in production

## 📝 Code Examples

### Adding a Milestone Programmatically

```javascript
const milestone = await prisma.cartMilestone.create({
  data: {
    cartDrawerId: cartDrawer.id,
    shop: 'example.myshopify.com',
    title: 'FREE Shipping',
    targetAmount: 2000,
    rewardType: 'free_shipping',
    discountCode: 'FREESHIP2000',
    icon: '🚚',
    unlockedMessage: '🎉 You've unlocked FREE Shipping!',
    inProgressMessage: 'Only {remaining} away from FREE Shipping!',
    priority: 1,
    isActive: true
  }
});
```

### Checking Unlocked Milestone

```javascript
const unlockedMilestone = MilestoneRewardManager.evaluateMilestones(
  milestones,
  cart
);

if (unlockedMilestone) {
  console.log('Unlocked:', unlockedMilestone.title);
  console.log('Discount:', unlockedMilestone.discountCode);
}
```

### Manual Gift Sync

```javascript
await MilestoneRewardManager.syncGiftProducts(
  unlockedMilestone,
  cart,
  loadCartCallback
);
```

## 🎓 Best Practices

1. **Test Discount Codes**: Always test codes in Shopify before configuring milestones
2. **Clear Messaging**: Use clear milestone messages so customers understand rewards
3. **Reasonable Thresholds**: Set achievable milestone targets
4. **Gift Inventory**: Monitor gift product inventory
5. **Multiple Milestones**: Limit to 3 milestones for best UX
6. **Progressive Rewards**: Make higher milestones more valuable

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify discount codes in Shopify Admin
3. Test with different cart values
4. Check API responses in Network tab

---

**Version**: 1.0.0
**Last Updated**: December 2025
**Compatibility**: Shopify Non-Plus stores only

