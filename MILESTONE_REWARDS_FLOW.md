# 🔄 Milestone Rewards System - Flow Diagrams

## 📊 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER ADDS PRODUCT TO CART                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              interceptAddToCart() in cart-drawer-class.js       │
│  - Intercepts form submit / AJAX calls                          │
│  - Calls /cart/add.js                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      loadCart() + open()                        │
│  - Fetches /cart.js                                             │
│  - Opens drawer                                                 │
│  - Renders UI immediately                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    loadMilestones() (parallel)                  │
│  - GET /api/milestones?shop=X&cartTotal=Y&cartItems=[...]      │
│  - Returns: { milestones: [...], progressBarColor, ... }       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              handleMilestoneRewards() (automatic)               │
│  - Evaluates milestones                                         │
│  - Syncs gift products                                          │
│  - Shows notification if unlocked                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      render() - Update UI                       │
│  - Shows milestone widget                                       │
│  - Shows reward indicator                                       │
│  - Updates cart items                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   USER CLICKS CHECKOUT BUTTON                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              handleCheckout() - Custom Handler                  │
│  - Validates milestone                                          │
│  - Ensures gifts present                                        │
│  - Gets checkout URL with discount                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            window.location.href = "/checkout?discount=CODE"     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  SHOPIFY CHECKOUT PAGE                          │
│  - Discount code applied automatically                          │
│  - Gift products appear as line items                           │
│  - Customer completes purchase                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎁 Gift Reward Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│              Cart Total: ₹1500 (Below Threshold)                │
│              Milestone: ₹2000 → Free Gift                       │
│              Status: Locked                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    User adds ₹600 product
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Cart Total: ₹2100 (Above Threshold)                │
│              evaluateMilestones() called                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              calculateCartTotalExcludingGifts()                 │
│  - Loops through cart.items                                     │
│  - Skips items with _upsellity_gift: true                      │
│  - Returns: ₹2100 (no gifts yet)                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Find highest unlocked milestone                    │
│  - Filter: targetAmount <= ₹2100                               │
│  - Sort: By targetAmount descending                             │
│  - Result: "Free Gift" milestone                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              syncGiftProducts(milestone, cart)                  │
│  - Check: Is gift already in cart?                              │
│  - Result: No                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              addGiftToCart(giftProduct, milestoneId)            │
│  - FormData: id=variantId, quantity=1                          │
│  - FormData: properties[_upsellity_gift]=true                  │
│  - FormData: properties[_upsellity_milestone_id]=milestone_id  │
│  - POST /cart/add.js                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Wait 300ms (for Shopify to process)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              loadCart() - Reload cart data                      │
│  - GET /cart.js                                                 │
│  - Cart now has gift item                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              render() - Update UI                               │
│  - Cart items: 2 items (product + gift)                        │
│  - Milestone indicator: "Free gift added to your cart"         │
│  - Badge: "✓ ACTIVE"                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              showMilestoneUnlockedNotification()                │
│  - Toast: "🎉 Milestone Unlocked: Free Gift!"                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔻 Gift Removal Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Cart Total: ₹2100 (with gift)                      │
│              Gift in cart: Yes                                  │
│              Milestone: Unlocked                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    User removes ₹600 product
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Cart Total: ₹1500 (Below Threshold)                │
│              evaluateMilestones() called                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              calculateCartTotalExcludingGifts()                 │
│  - Loops through cart.items                                     │
│  - Skips gift item (has _upsellity_gift: true)                │
│  - Returns: ₹1500 (excluding gift)                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Find highest unlocked milestone                    │
│  - Filter: targetAmount <= ₹1500                               │
│  - Result: null (no milestone unlocked)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              syncGiftProducts(null, cart)                       │
│  - unlockedMilestone = null                                     │
│  - Action: Remove all gifts                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              getAllGiftsInCart(cart)                            │
│  - Finds: 1 gift item                                           │
│  - Returns: [{ key: "...", properties: {...} }]                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              removeGiftFromCart(itemKey)                        │
│  - POST /cart/change.js                                         │
│  - Body: { id: itemKey, quantity: 0 }                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              loadCart() - Reload cart data                      │
│  - GET /cart.js                                                 │
│  - Cart now has only 1 item (gift removed)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              render() - Update UI                               │
│  - Cart items: 1 item (product only)                           │
│  - Milestone indicator: Hidden                                  │
│  - Progress bar: Shows 75% (₹1500/₹2000)                       │
└─────────────────────────────────────────────────────────────────┘
```

## 💰 Discount Reward Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Cart Total: ₹5500                                  │
│              Milestone: ₹5000 → 10% OFF (CODE: SAVE10)         │
│              Status: Unlocked                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              evaluateMilestones()                               │
│  - Returns: { discountCode: "SAVE10", rewardType: "..." }     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              syncGiftProducts()                                 │
│  - rewardType !== "gift_wrapping"                              │
│  - Action: Skip (no cart modification needed)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              render() - Show reward indicator                   │
│  - Badge: "10% OFF Unlocked!"                                  │
│  - Message: "Discount code SAVE10 will be applied"            │
│  - Badge: "✓ ACTIVE"                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    User clicks Checkout
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              handleCheckout()                                   │
│  - validateMilestoneForCheckout()                               │
│  - Result: { valid: true }                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              getCheckoutUrlWithDiscount()                       │
│  - Returns: "/checkout?discount=SAVE10"                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              window.location.href = "/checkout?discount=SAVE10" │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              SHOPIFY CHECKOUT                                   │
│  - Discount "SAVE10" applied automatically                     │
│  - 10% discount shown in order summary                          │
│  - Customer completes purchase                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Multiple Milestones Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Configured Milestones:                             │
│  1. ₹2000 → Free Shipping (CODE: SHIP2000)                    │
│  2. ₹5000 → 10% OFF (CODE: SAVE10)                            │
│  3. ₹8000 → Free Gift (CODE: GIFT8000)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Cart Total: ₹8500
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              evaluateMilestones()                               │
│  Step 1: Filter unlocked milestones                             │
│    - ₹8500 >= ₹2000 ✓                                          │
│    - ₹8500 >= ₹5000 ✓                                          │
│    - ₹8500 >= ₹8000 ✓                                          │
│  Result: [Milestone1, Milestone2, Milestone3]                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Sort by targetAmount descending                    │
│    - Milestone3 (₹8000)                                        │
│    - Milestone2 (₹5000)                                        │
│    - Milestone1 (₹2000)                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Return highest: Milestone3                         │
│  - Title: "Free Gift"                                           │
│  - Code: "GIFT8000"                                            │
│  - Type: "gift_wrapping"                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              syncGiftProducts()                                 │
│  - Remove gifts from lower milestones (if any)                 │
│  - Add gift from Milestone3                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Checkout                                           │
│  - Only GIFT8000 is applied                                     │
│  - SHIP2000 and SAVE10 are ignored                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Race Condition Prevention

```
┌─────────────────────────────────────────────────────────────────┐
│              User rapidly adds/removes products                 │
│  - Add product (cart: ₹2100)                                   │
│  - Remove product (cart: ₹1500)                                │
│  - Add product (cart: ₹2100)                                   │
│  All within 500ms                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              First handleMilestoneRewards() call                │
│  - Sets: isSyncingGifts = true                                 │
│  - Evaluates milestone                                          │
│  - Starts adding gift                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Second handleMilestoneRewards() call               │
│  - Checks: isSyncingGifts === true                             │
│  - Action: Skip (return early)                                 │
│  - Log: "Already syncing gifts, skipping..."                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              First call completes                               │
│  - Gift added successfully                                      │
│  - Sets: isSyncingGifts = false                                │
│  - Reloads cart                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Third handleMilestoneRewards() call                │
│  - Checks: isSyncingGifts === false                            │
│  - Proceeds normally                                            │
│  - Evaluates current state                                      │
│  - Syncs gifts based on current cart total                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Result: No duplicate gifts                         │
│  - Only one gift in cart                                        │
│  - Correct milestone applied                                    │
│  - No errors in console                                         │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 UI Update Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Cart state changes                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              render() called                                    │
│  - Creates React element                                        │
│  - Passes props: config, cart, unlockedMilestone, ...         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              UnifiedCartDrawer component                        │
│  - Receives unlockedMilestone prop                             │
│  - Renders milestone widget                                     │
│  - Renders reward indicator (if unlocked)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              MilestonesWidget component                         │
│  - Shows progress bar                                           │
│  - Shows milestone icons                                        │
│  - Shows remaining amount                                       │
│  - Updates in real-time                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Reward Indicator (if unlocked)                     │
│  - Green background                                             │
│  - Shows milestone icon + title                                 │
│  - Shows reward description                                     │
│  - Shows "✓ ACTIVE" badge                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Checkout Button                                    │
│  - onClick: handleCheckout()                                    │
│  - Applies correct discount code                                │
│  - Validates before redirect                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

**Visual Guide Complete!** 🎉
Use these diagrams to understand the system flow.

