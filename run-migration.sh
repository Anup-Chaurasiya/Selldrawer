#!/bin/bash

# Script to run the milestone discount code migration

echo "🔄 Running Prisma migration for discountCode field..."
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Run the migration
npx prisma migrate deploy

# Regenerate Prisma client
echo ""
echo "🔄 Regenerating Prisma client..."
npx prisma generate

echo ""
echo "✅ Migration complete!"
echo ""
echo "You can now restart your dev server or it should auto-reload."

