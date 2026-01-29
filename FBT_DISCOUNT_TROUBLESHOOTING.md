# 🔍 FBT Discount Troubleshooting & Diagnosis

## How It Should Work

```
1. User views product page
   ↓
2. Widget loads from /api/fbt
   - Returns bundleMetadata with discount info
   ↓
3. User selects products & clicks "Add to Cart"
   ↓
4. Widget adds products with properties:
   - _fbt_bundle_id: fbt_{ruleId}_{timestamp}
   - _fbt_discount_type: PERCENTAGE or FIXED
   - _fbt_discount_value: 10 (for 10% off)
   ↓
5. User goes to checkout
   ↓
6. Discount Function runs:
   - Reads line item properties
   - Groups by bundle_id
   - Applies discount
   ↓
7. Customer sees: "FBT Bundle: 10% off"
```

## 🐛 Common Issues & Fixes

### Issue 1: No Discount Rule Configured

**Symptom:** Product properties not added to cart  
**Cause:** No matching FBT rule for the product

**Check:**
1. Go to FBT Admin
2. Look for a rule matching your product
3. Ensure rule has:
   - ✅ Trigger Type: "Specific Product" or "All Products"
   - ✅ Discount Type: "Percentage" or "Fixed"
   - ✅ Discount Value: > 0

**Fix:**
- Create/edit rule
- Set discount type and value
- Save

---

### Issue 2: Properties Not Being Added

**Symptom:** Cart items don't have `_fbt_bundle_id` property

**Debug Steps:**

1. **Check cart properties** (browser console):
```javascript
fetch('/cart.js')
  .then(r => r.json())
  .then(cart => {
    cart.items.forEach((item, i) => {
      console.log(`Item ${i}:`, item.title);
      console.log('  Properties:', item.properties);
      console.log('  Bundle ID:', item.properties._fbt_bundle_id);
      console.log('  Discount Type:', item.properties._fbt_discount_type);
      console.log('  Discount Value:', item.properties._fbt_discount_value);
    });
  });
```

**Expected Output:**
```javascript
Item 0: Product A
  Properties: {
    _fbt_bundle_id: "fbt_clxyz123_1706512345678",
    _fbt_discount_type: "PERCENTAGE",
    _fbt_discount_value: "10",
    _upsell_source: "fbt"
  }
```

**If properties are missing:**

2. **Check API response:**
```javascript
// Replace with your shop and product handle
const shop = "your-shop.myshopify.com";
const handle = "product-handle";

fetch(`https://your-app-url.com/api/fbt?shop=${shop}&productHandle=${handle}`)
  .then(r => r.json())
  .then(data => {
    console.log('Config:', data.config);
    console.log('Bundle Metadata:', data.config?.bundleMetadata);
  });
```

**Expected:**
```javascript
bundleMetadata: {
  ruleId: "clxyz123",
  discountType: "percentage",
  discountValue: 10,
  hasDiscount: true
}
```

**If bundleMetadata is null:**
- No matching rule found
- Go to FBT Admin and create a rule

---

### Issue 3: Automatic Discount Not Created

**Symptom:** Properties exist but no discount at checkout

**Check:**
1. Go to Shopify Admin → Discounts
2. Look for "FBT Bundle Discount"

**If not there:**

**Option A: Use FBT Admin UI**
1. Go to FBT Admin page
2. Look for "Discount Function Status" card
3. Should show "✅ Function Deployed"
4. Click "Activate FBT Discount"

**Option B: Use GraphiQL**
```graphql
# Get function ID
query {
  shopifyFunctions(first: 25) {
    nodes {
      id
      apiType
      title
    }
  }
}

# Create discount (use ID from above)
mutation {
  discountAutomaticAppCreate(
    automaticAppDiscount: {
      title: "FBT Bundle Discount"
      functionId: "gid://shopify/Function/YOUR_ID_HERE"
      startsAt: "2026-01-29T00:00:00Z"
      combinesWith: {
        orderDiscounts: true
        productDiscounts: true
        shippingDiscounts: true
      }
      discountClasses: [PRODUCT]
    }
  ) {
    automaticAppDiscount {
      discountId
      title
    }
    userErrors {
      field
      message
    }
  }
}
```

---

### Issue 4: Function Not Finding Properties

**Symptom:** Properties exist, discount created, still no discount

**Check function logs:**
```bash
cd extensions/discount-function-rs
shopify app function replay
```

This shows you:
- Input: What properties the function received
- Output: What discounts it calculated

**If input shows empty attributes:**
- Properties might have wrong keys
- Check property names match exactly:
  - `_fbt_bundle_id` (not `fbt_bundle_id`)
  - `_fbt_discount_type` (not `discount_type`)
  - `_fbt_discount_value` (not `discount_value`)

---

### Issue 5: Discount Type or Value Wrong

**Common mistakes:**

1. **Discount Type** must be uppercase in properties:
   - ✅ `"PERCENTAGE"`
   - ❌ `"percentage"`
   - ✅ `"FIXED"`
   - ❌ `"fixed"`

2. **Discount Value** must be a string number:
   - ✅ `"10"` (for 10% or $10)
   - ❌ `10` (number, not string)
   - ❌ `"10%"` (has % symbol)

**Check widget code:** (line 337-338 in fbt-widget-entry.js)
```javascript
properties['_fbt_discount_type'] = bundleMetadata.discountType?.toUpperCase() || 'PERCENTAGE';
properties['_fbt_discount_value'] = bundleMetadata.discountValue?.toString() || '0';
```

This should correctly convert:
- `"percentage"` → `"PERCENTAGE"`
- `10` → `"10"`

---

## ✅ Complete Diagnosis Checklist

Run through this in order:

### 1. FBT Rule Configuration
- [ ] FBT feature is enabled (Status card shows "enabled")
- [ ] Rule exists for the product
- [ ] Rule has discount type set (percentage/fixed)
- [ ] Rule has discount value > 0
- [ ] Rule is saved

### 2. API Response  
- [ ] `/api/fbt` returns bundleMetadata
- [ ] bundleMetadata.hasDiscount = true
- [ ] bundleMetadata.discountType set
- [ ] bundleMetadata.discountValue > 0

### 3. Cart Properties
- [ ] Products have `_fbt_bundle_id` property
- [ ] Products have `_fbt_discount_type` property (UPPERCASE)
- [ ] Products have `_fbt_discount_value` property (string)
- [ ] All products in bundle have SAME bundle_id

### 4. Automatic Discount
- [ ] Discount exists in Shopify Admin → Discounts
- [ ] Discount is "FBT Bundle Discount"
- [ ] Discount is Active (not draft/expired)
- [ ] Discount uses the function

### 5. Function Deployment
- [ ] Function is deployed: `shopify app versions list`
- [ ] Function shows in FBT Admin UI
- [ ] Function ID matches discount's functionId

### 6. Checkout
- [ ] Test at CHECKOUT (not cart)
- [ ] Discount appears under order summary
- [ ] Discount message shows correctly

---

## 🚀 Quick Test Script

Run this in browser console on product page after adding FBT products:

```javascript
(async () => {
  console.log('=== FBT Discount Diagnosis ===\n');
  
  // 1. Check cart properties
  const cart = await fetch('/cart.js').then(r => r.json());
  console.log('1. CART ITEMS:');
  const fbtItems = cart.items.filter(item => item.properties._fbt_bundle_id);
  
  if (fbtItems.length === 0) {
    console.error('❌ No FBT items found in cart!');
    console.log('   Check: Is FBT widget adding properties?');
  } else {
    console.log(`✅ Found ${fbtItems.length} FBT items`);
    fbtItems.forEach((item, i) => {
      console.log(`\n   Item ${i + 1}: ${item.title}`);
      console.log(`   Bundle ID: ${item.properties._fbt_bundle_id}`);
      console.log(`   Type: ${item.properties._fbt_discount_type}`);
      console.log(`   Value: ${item.properties._fbt_discount_value}`);
    });
    
    // Check if all have same bundle ID
    const bundleIds = [...new Set(fbtItems.map(i => i.properties._fbt_bundle_id))];
    if (bundleIds.length === 1) {
      console.log(`\n✅ All items share bundle ID: ${bundleIds[0]}`);
    } else {
      console.error(`\n❌ Multiple bundle IDs found: ${bundleIds.join(', ')}`);
    }
    
    // Check discount type
    const discountType = fbtItems[0].properties._fbt_discount_type;
    if (discountType === 'PERCENTAGE' || discountType === 'FIXED') {
      console.log(`✅ Valid discount type: ${discountType}`);
    } else {
      console.error(`❌ Invalid discount type: ${discountType}`);
    }
    
    // Check discount value
    const discountValue = parseFloat(fbtItems[0].properties._fbt_discount_value);
    if (!isNaN(discountValue) && discountValue > 0) {
      console.log(`✅ Valid discount value: ${discountValue}`);
    } else {
      console.error(`❌ Invalid discount value: ${fbtItems[0].properties._fbt_discount_value}`);
    }
  }
  
  console.log('\n2. NEXT STEPS:');
  console.log('   - Go to checkout');
  console.log('   - Look for "FBT Bundle: X% off" message');
  console.log('   - Check order summary for discount');
  console.log('\n=== End Diagnosis ===');
})();
```

---

## 📝 Summary

The discount flow is:

1. **Admin** creates rule with discount
2. **API** returns bundleMetadata
3. **Widget** adds properties to cart
4. **Function** reads properties at checkout
5. **Customer** sees discount

**Most common issue:** No matching rule configured (check FBT Admin)

**Second most common:** Automatic discount not created (use GraphiQL or FBT Admin UI)

**Third most common:** Testing in cart instead of checkout (discount applies at **CHECKOUT**)
