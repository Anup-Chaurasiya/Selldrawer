# Merchant Guide: Activating Automatic Discounts

## What Are Automatic Discounts?

Selldrawer uses a single automatic discount called **"Selldrawer Automatic Discounts"** to power all your discount features:

- 🎁 **FBT Bundle Discounts** - Discounts when customers buy frequently bought together items
- 🎯 **Milestone Rewards** - Free shipping, percentage off, fixed discounts, or free gifts when cart reaches a threshold
- 🎁 **Gift Rewards** - Free products added to cart

## One-Time Setup (Takes 30 seconds)

### Step 1: Go to Your Dashboard
After installing Selldrawer, you'll see your main dashboard (home page).

### Step 2: Look for the Blue Banner
You'll see a banner that says:

```
ℹ️ Activate Automatic Discounts

Enable automatic discounts for FBT bundles, milestones, and gift rewards. 
This is a one-time setup that creates a single discount in your Shopify 
admin called "Selldrawer Automatic Discounts".

[Activate Automatic Discounts]
```

### Step 3: Click the Button
Click the **"Activate Automatic Discounts"** button. The system will:
1. Check if the discount function is deployed
2. Create the automatic discount in your Shopify admin
3. Save the activation status

### Step 4: Success!
You'll see a green success banner:

```
✅ Automatic discounts are active. Your FBT bundles, milestones, 
and gift rewards will automatically apply discounts at checkout.
```

## That's It!

You're done! The discount is now active and will work for:
- All FBT bundle configurations
- All milestone rewards
- All gift rewards

## Verifying in Shopify Admin

1. Go to your Shopify Admin
2. Navigate to **Discounts**
3. Look for **"Selldrawer Automatic Discounts"** in the automatic discounts section
4. It should show as **Active**

## Troubleshooting

### "Discount function not found" Error
This means the discount function hasn't been deployed yet. Contact support or run:
```bash
npm run deploy
```

### "Failed to create automatic discount" Error
Check the server logs for details. Common causes:
- Missing Shopify permissions
- API rate limits
- Network issues

### Discount Not Applying at Checkout
Make sure:
1. The discount is activated (green banner on home page)
2. Your FBT/milestone/gift configuration is set up correctly
3. The discount appears as "Active" in Shopify Admin
4. Cart meets the requirements (bundle items, threshold, etc.)

## FAQ

**Q: Can I rename the discount?**
A: No, the discount name is fixed as "Selldrawer Automatic Discounts" to ensure proper functionality.

**Q: Can I have multiple automatic discounts?**
A: No, Selldrawer uses a single automatic discount for all features. This prevents conflicts and simplifies management.

**Q: What if I delete the discount in Shopify Admin?**
A: You can reactivate it by going to the home page and clicking "Activate Automatic Discounts" again.

**Q: Does this work with other discount apps?**
A: The discount is configured to NOT combine with other discounts to prevent conflicts. Only Selldrawer discounts will apply.

**Q: Can I see which orders used Selldrawer discounts?**
A: Yes! Check your analytics dashboard on the home page to see revenue from upsells and orders with discounts applied.

## Need Help?

If you encounter any issues:
1. Check the home page for error messages
2. Verify the discount exists in Shopify Admin
3. Check your app configuration
4. Contact Selldrawer support

---

**Remember**: This is a one-time setup. Once activated, all your discount features will work automatically! 🎉
