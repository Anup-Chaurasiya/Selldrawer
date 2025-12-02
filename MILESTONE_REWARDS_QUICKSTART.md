# 🚀 Milestone Rewards - Quick Start Guide

## 30-Second Overview

Client-side milestone reward system for Shopify Non-Plus. Automatically adds gift products and applies discount codes when customers reach cart value thresholds.

## 5-Minute Setup

### 1. Database (1 min)
```bash
npx prisma migrate dev --name add_discount_code_to_milestones
```

### 2. Shopify Admin (2 min)
Create discount codes:
- Go to **Discounts** → **Create discount**
- Example: `FREESHIP2000` (Free Shipping)
- Copy the code

### 3. App Configuration (2 min)
- Go to **Cart Drawer** → **Milestones**
- Click **Add Milestone**
- Fill form:
  - Title: "FREE Shipping"
  - Target: 2000
  - Reward Type: Free Shipping
  - **Discount Code**: FREESHIP2000 ← REQUIRED
- Save

## How It Works (3 Scenarios)

### Scenario 1: Gift Reward
```
Cart: ₹2500 → Gift auto-added → Checkout → /checkout?discount=CODE
```

### Scenario 2: Discount Reward
```
Cart: ₹5000 → No cart change → Checkout → /checkout?discount=CODE
```

### Scenario 3: Multiple Milestones
```
Cart: ₹8000 → Highest milestone wins → Checkout → /checkout?discount=HIGHEST_CODE
```

## Key Files

```
milestone-reward-manager.js  ← Core logic (400+ lines)
cart-drawer-class.js         ← Integration
UnifiedCartDrawer.jsx        ← UI
api.milestones.tsx          ← API endpoint
```

## Testing (5 min)

```javascript
// 1. Add ₹2500 worth of products
// 2. Check console: "Gift added to cart"
// 3. Check cart: Gift has _upsellity_gift property
// 4. Remove products (cart drops to ₹1500)
// 5. Check console: "Gift removed from cart"
// 6. Add products again
// 7. Click checkout
// 8. Verify URL: /checkout?discount=CODE
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Gift not adding | Check variant ID, product active |
| Gift not removing | Verify `_upsellity_gift` property |
| Discount not applied | Check code exists in Shopify |
| Multiple gifts | System prevents this automatically |

## API Quick Reference

### Request
```
GET /api/milestones?shop=X&cartTotal=Y&cartItems=[...]
```

### Response
```json
{
  "milestones": [{
    "id": "...",
    "title": "FREE Shipping",
    "targetAmount": 2000,
    "discountCode": "FREESHIP2000",
    "status": "unlocked",
    "giftProducts": []
  }]
}
```

## Code Snippets

### Check Unlocked Milestone
```javascript
const unlocked = MilestoneRewardManager.evaluateMilestones(milestones, cart);
console.log(unlocked?.title); // "FREE Shipping"
```

### Manual Gift Sync
```javascript
await MilestoneRewardManager.syncGiftProducts(milestone, cart, loadCart);
```

### Get Checkout URL
```javascript
const url = MilestoneRewardManager.getCheckoutUrlWithDiscount(milestone);
// Returns: "/checkout?discount=CODE"
```

## Critical Rules

1. ✅ **Discount code MUST exist in Shopify first**
2. ✅ **Gift products need variant ID (not product ID)**
3. ✅ **All reward types need discount code**
4. ✅ **Cart total excludes gift items**
5. ✅ **Highest milestone wins**

## Console Messages

```javascript
// Success
"Upsellity Milestones: Gift added to cart"
"Upsellity Milestones: Gift removed from cart"

// Errors
"Upsellity Milestones: Invalid gift product"
"Upsellity Milestones: Failed to add gift"
"Upsellity Milestones: No discount code configured"
```

## Deployment Checklist

- [ ] Run migration
- [ ] Create Shopify discount codes
- [ ] Configure milestones in app
- [ ] Test gift add/remove
- [ ] Test discount application
- [ ] Test multiple milestones
- [ ] Test checkout flow
- [ ] Verify no console errors
- [ ] Deploy to production

## Need Help?

- **Full Guide**: `MILESTONE_REWARDS_IMPLEMENTATION.md`
- **Summary**: `MILESTONE_REWARDS_SUMMARY.md`
- **Console**: Check browser console for errors
- **Network**: Check `/api/milestones` responses

---

**Ready to use!** 🎉

