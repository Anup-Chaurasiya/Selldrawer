# 🛒 Upsellity Cart Drawer - Complete Guide

## Overview

The Upsellity Cart Drawer is a powerful, theme-agnostic solution that transforms your Shopify cart into an engaging, conversion-optimized experience. It works with **ANY Shopify theme** without requiring complex theme modifications.

## ✨ Features

### 1. **Free Shipping Progress Bar**
- Visual progress indicator showing how much more customers need to spend
- Customizable threshold amounts
- Configurable colors and messages
- Optional percentage display

### 2. **Promotional Banners**
- Eye-catching promotional messages in the cart
- Fully customizable colors and text
- Schedule-based display (start/end dates)
- Cart value targeting

### 3. **Product Recommendations ("You may also like")**
- Multiple recommendation strategies:
  - Manual selection
  - Related products
  - Frequently bought together
  - Best sellers
  - AI-powered suggestions
- Customizable layout (grid/carousel)
- Configurable discount badges
- Quick add-to-cart buttons

### 4. **Coupon Code Field**
- Allow customers to apply discount codes
- Customizable messages and button text
- Real-time validation

### 5. **Savings Display**
- Show total savings to encourage checkout
- Prominent, customizable display
- Automatic calculation of discounts

### 6. **Free Shipping Messages**
- Bottom-of-cart shipping threshold reminders
- Multiple message templates
- Dynamic remaining amount calculation

## 🚀 Installation Methods

### Method 1: Theme App Extension (Recommended - Easiest)

This is the **easiest and recommended** method for all merchants.

#### Steps:

1. **Deploy Your App** (if not already deployed)
   ```bash
   npm run deploy
   ```

2. **Merchant Installation:**
   - Merchant goes to **Online Store → Themes**
   - Clicks **Customize** on their active theme
   - In the theme editor, clicks **App embeds** (bottom of left sidebar)
   - Finds **"Upsellity Cart Drawer"** and toggles it ON
   - The app URL is pre-filled (https://app.upsellity.com)
   - Clicks **Save**

3. **That's It!** The cart drawer is now live.

#### Advantages:
- ✅ Works with any theme
- ✅ No code editing required
- ✅ Easy to enable/disable
- ✅ Survives theme updates
- ✅ One-click installation

### Method 2: Manual Theme Integration

For advanced users or when you need more control.

#### Steps:

1. **Add to Theme:**
   - Go to **Online Store → Themes → Actions → Edit code**
   - Open **Layout → theme.liquid**
   - Find the closing `</body>` tag
   - Add this line just before it:
   ```liquid
   {% render 'cart-drawer-loader', app_url: 'https://app.upsellity.com' %}
   ```

2. **Save and Test**

Note: The cart-drawer-loader snippet is automatically available from your app extension.

## 📋 Configuration Guide

### Accessing the Dashboard

1. Open the Upsellity app in your Shopify admin
2. Click **"Cart Drawer"** in the navigation
3. You'll see all available features with their status

### Configuring Each Feature

#### Free Shipping Progress Bar
1. Click **"Configure"** on the Free Shipping Progress Bar card
2. Set your threshold amount (e.g., ₹5000)
3. Customize messages (use `{remaining}` for dynamic amount)
4. Choose your colors
5. Toggle percentage display on/off
6. Click **"Save"**

#### Promotional Banner
1. Click **"Configure"** on the Promotional Banner card
2. Enter your title (e.g., "Summer Sale!")
3. Add subtitle for details (e.g., "Buy 2 Get 10% OFF")
4. Customize background and text colors
5. Click **"Save"**

#### Product Recommendations
1. Click **"Configure"** on Product Recommendations
2. Choose recommendation type:
   - **Manual**: You select specific products
   - **Related**: Show related products from Shopify
   - **Frequently Bought Together**: Based on purchase patterns
   - **Best Sellers**: Your top-selling products
   - **AI Powered**: Intelligent recommendations
3. Set maximum number of products to show
4. Choose layout (grid or carousel)
5. Toggle discount badges and add buttons
6. Click **"Save"**

#### Coupon Code Field
1. Click **"Configure"** on Coupon Code Field
2. Customize placeholder text
3. Set button text
4. Configure success/error messages
5. Click **"Save"**

#### Savings Display
1. Click **"Configure"** on Savings Display
2. Customize message (use `{amount}` for dynamic savings)
3. Choose position in cart
4. Set colors
5. Click **"Save"**

#### Free Shipping Message
1. Click **"Configure"** on Free Shipping Message
2. Set threshold amount
3. Configure messages for different states:
   - Before threshold
   - After threshold (showing remaining)
   - Threshold achieved
4. Customize colors
5. Click **"Save"**

## 🎨 Preview Your Cart

At any time, you can click **"Preview Cart"** to see exactly how your cart drawer will look to customers with all enabled features.

## 🔧 How It Works

### Technical Overview

1. **Script Loading**: The extension loads a lightweight JavaScript file on your storefront
2. **Cart Interception**: Automatically intercepts "Add to Cart" actions
3. **Drawer Display**: Shows a sliding cart drawer instead of redirecting to cart page
4. **Feature Rendering**: Dynamically renders enabled features based on your configuration
5. **Real-time Updates**: Configuration changes are reflected immediately (no code deployment needed)

### Data Flow

```
Customer adds to cart
    ↓
Extension intercepts action
    ↓
Loads cart data from Shopify
    ↓
Fetches feature config from your app (/api/cart-drawer)
    ↓
Renders cart drawer with enabled features
    ↓
Customer sees personalized cart experience
```

## 🎯 Best Practices

### Free Shipping Threshold
- Set it based on your average order value (AOV)
- Use psychological pricing (e.g., ₹4999 instead of ₹5000)
- Test different thresholds to maximize AOV

### Promotional Banners
- Keep messages short and impactful
- Use contrasting colors for visibility
- Update regularly to keep content fresh
- Use urgency ("Limited Time Only!")

### Product Recommendations
- Start with 2-4 products to avoid overwhelming customers
- Use "Frequently Bought Together" for best conversions
- Ensure recommended products are in stock
- Test different recommendation strategies

### Savings Display
- Always show savings to reinforce value
- Place it prominently (default: above total)
- Use encouraging language ("You're saving...")

## 📱 Mobile Optimization

The cart drawer is fully responsive and optimized for mobile devices:
- Full-width on mobile screens
- Touch-friendly buttons and controls
- Smooth animations
- Fast loading

## 🔄 Theme Compatibility

The cart drawer works with **all Shopify themes**, including:
- Dawn
- Debut
- Brooklyn
- Minimal
- Supply
- Custom themes
- Third-party themes

### How We Ensure Compatibility

1. **Non-invasive**: We don't modify your theme files (except one line addition)
2. **Independent**: Runs as a separate layer over your existing cart
3. **Failsafe**: If the script fails to load, default cart behavior continues
4. **CSS Isolation**: Uses scoped styles to avoid conflicts

## 🐛 Troubleshooting

### Cart drawer not showing?
- Clear browser cache and refresh
- Check that app embed is enabled in theme editor
- Verify app URL is correct in configuration
- Check browser console for JavaScript errors

### Features not appearing?
- Ensure features are **enabled** in the Cart Drawer dashboard
- Check that you've configured at least one instance of each feature
- Verify your configuration has been saved

### Conflicts with existing cart?
- The drawer automatically overrides default cart behavior
- If you have custom cart JavaScript, it may need adjustment
- Check for JavaScript errors in browser console

### Styling issues?
- The drawer uses its own styles to maintain consistency
- Custom CSS can be added if needed
- Contact support for theming assistance

## 🚦 Going Live Checklist

Before launching to customers:

- [ ] All desired features are enabled and configured
- [ ] Preview tested and looks good
- [ ] Threshold amounts are set correctly
- [ ] Messages are spell-checked and branded correctly
- [ ] Colors match your brand
- [ ] Tested on mobile devices
- [ ] Tested on desktop
- [ ] Test purchases completed successfully
- [ ] Analytics tracking verified (if enabled)

## 📊 Performance

The cart drawer is optimized for performance:
- **Script size**: < 15KB (minified)
- **Load time**: < 100ms
- **API calls**: Cached for 5 minutes
- **No impact on page speed scores**

## 🔐 Security

- All API calls use HTTPS
- No sensitive data stored in browser
- CORS-protected endpoints
- Regular security updates

## 🆘 Support

Need help?
- Check this guide first
- Review the installation video (if available)
- Contact support through the app
- Email: support@upsellity.com (customize as needed)

## 🔄 Updates

The cart drawer receives automatic updates:
- New features added regularly
- Bug fixes deployed automatically
- No action required from merchants
- Backward compatible

## 📈 Analytics (Coming Soon)

Track important metrics:
- Cart drawer open rate
- Feature engagement
- Recommendation click-through rate
- Average order value impact
- Conversion rate improvements

---

## Quick Reference

### API Endpoint
```
GET /api/cart-drawer?shop={shop-domain}
```

Returns current configuration for the shop.

### JavaScript Global
```javascript
window.upsellityDrawer.open()   // Open drawer
window.upsellityDrawer.close()  // Close drawer
```

### Customization Tokens

**Free Shipping Progress Bar:**
- `{remaining}` - Amount left to reach threshold
- `{threshold}` - Total threshold amount

**Savings Display:**
- `{amount}` - Total savings amount

**Free Shipping Message:**
- `{threshold}` - Free shipping threshold
- `{remaining}` - Amount remaining

---

**Version**: 1.0.0
**Last Updated**: 2025


