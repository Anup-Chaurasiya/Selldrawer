#!/bin/bash

echo "========================================="
echo "GIFTING BLOCK DIAGNOSTIC TEST"
echo "========================================="
echo ""

echo "1. Checking if files exist..."
if [ -f "app/routes/api.gifting-block.tsx" ]; then
    echo "✓ API route exists"
else
    echo "✗ API route missing!"
fi

if [ -f "app/routes/app.gifting-block.tsx" ]; then
    echo "✓ Admin route exists"
else
    echo "✗ Admin route missing!"
fi

if [ -f "extensions/cart-upsell/blocks/gift-block.liquid" ]; then
    echo "✓ Theme block exists"
else
    echo "✗ Theme block missing!"
fi

if [ -f "extensions/cart-upsell/assets/gift-block.js" ]; then
    echo "✓ JavaScript bundle exists ($(du -h extensions/cart-upsell/assets/gift-block.js | cut -f1))"
else
    echo "✗ JavaScript bundle missing!"
fi

echo ""
echo "2. Testing API endpoint..."
RESPONSE=$(curl -s "http://localhost:3000/api/gifting-block?shop=upsellity-dev.myshopify.com&cartTotal=1800&cartItems=%5B%5D")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "enabled"; then
    echo "✓ API responding"
else
    echo "✗ API not responding or error"
fi

echo ""
echo "3. Checking database schema..."
echo "Run manually: npx prisma db pull --print"

echo ""
echo "========================================="
echo "NEXT STEPS:"
echo "========================================="
echo "1. Make sure Shopify dev is running: shopify app dev"
echo "2. Check admin at: /app/gifting-block"
echo "3. Add gift with threshold ₹1600"
echo "4. Add block to theme"
echo "5. Test on product page with cart > ₹1600"
echo "========================================="
