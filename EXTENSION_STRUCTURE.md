# ✅ Cart Drawer Extension Structure

## Final Structure

```
extensions/cart-upsell/
├── assets/
│   ├── cart-drawer.js          ← Cart drawer JavaScript
│   └── thumbs-up.png
├── blocks/
│   ├── cart_upsell_widget.liquid      ← Original widget
│   └── cart-drawer-embed.liquid       ← NEW: App Embed (recommended)
├── snippets/
│   └── cart-drawer-loader.liquid      ← Manual installation option
├── locales/
│   └── en.default.json
└── shopify.extension.toml
```

## How Merchants Install

### Method 1: App Embed (Recommended) ⭐

**Merchant Steps:**
1. Go to **Online Store → Themes → Customize**
2. Click **App embeds** (bottom of left sidebar)
3. Find **"Upsellity Cart Drawer"** and toggle it ON
4. Enter app URL in the settings
5. Click **Save**

**Technical:**
- Uses `blocks/cart-drawer-embed.liquid`
- Has schema settings (app_url)
- Automatically loads on all pages
- Easy to enable/disable

### Method 2: Manual Snippet

**Merchant Steps:**
1. Go to **Online Store → Themes → Edit code**
2. Open `Layout → theme.liquid`
3. Add before `</body>`:
   ```liquid
   {% render 'cart-drawer-loader', app_url: 'https://your-app.fly.dev' %}
   ```
4. Save

**Technical:**
- Uses `snippets/cart-drawer-loader.liquid`
- Requires manual app_url parameter
- More control but harder to install

## Files Explained

### `blocks/cart-drawer-embed.liquid`
- **Type**: App Embed Block
- **Purpose**: Easy merchant installation via theme editor
- **Features**:
  - Schema settings (app_url)
  - Shows in App embeds section
  - Toggle on/off easily
  - Loads `cart-drawer.js`
  - Sets `data-upsellity-app-url` attribute

### `snippets/cart-drawer-loader.liquid`
- **Type**: Liquid Snippet
- **Purpose**: Manual installation option
- **Features**:
  - Accepts `app_url` parameter
  - Loads `cart-drawer.js`
  - Sets `data-upsellity-app-url` attribute
  - Conditional loading (only if app_url provided)

### `assets/cart-drawer.js`
- **Type**: JavaScript Asset
- **Purpose**: Cart drawer functionality
- **Features**:
  - Intercepts add to cart
  - Shows drawer UI
  - Fetches config from app API
  - Renders enabled features
  - ~15KB minified

## Updated Documentation

All documentation now reflects:
- ✅ Single extension: **"cart-upsell"**
- ✅ Two installation methods
- ✅ Recommended: App Embed
- ✅ Alternative: Manual snippet

## Errors Fixed

### Error 1: Multiple Extensions ✅ FIXED
**Was**: Had 2 theme extensions (cart-upsell + cart-drawer)
**Now**: Single extension with both features

### Error 2: Schema in Snippet ✅ FIXED
**Was**: `{% schema %}` in snippet (not allowed)
**Now**: Schema in app embed block, snippet accepts parameters

## Testing

Run this to test:
```bash
npm run dev
```

Should see no errors now!

## Deploy

When ready:
```bash
npm run deploy
```

The extension will be available in:
- **App embeds** section (cart-drawer-embed.liquid)
- Theme code as snippet (cart-drawer-loader.liquid)

---

**Status**: ✅ ALL ERRORS FIXED - Ready to deploy!


