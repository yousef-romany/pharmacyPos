#!/bin/bash

# Apply database migration script
# This script applies the pending database migrations

echo "========================================="
echo "  Pharmacy POS - Database Migration"
echo "========================================="
echo ""

# Check if migration file exists
MIGRATION_FILE="migrations/001_add_payment_method_type_to_treasuries.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📁 Found migration file: $MIGRATION_FILE"
echo ""

# Prompt for database credentials
read -p "Enter MySQL username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Enter MySQL password: " DB_PASSWORD
echo ""

read -p "Enter database name (default: pharmacypos): " DB_NAME
DB_NAME=${DB_NAME:-pharmacypos}

echo ""
echo "🔄 Applying migration..."
echo ""

# Apply migration
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "Summary of changes:"
    echo "  - Added 'paymentMethodType' column to Treasuries table"
    echo "  - Updated payment methods ENUM in SalesTransactions"
    echo ""
    echo "You can now:"
    echo "  1. Add multiple treasuries for each payment method"
    echo "  2. Use split payments in POS and purchases"
    echo "  3. View detailed payment breakdowns in treasury reports"
else
    echo ""
    echo "❌ Migration failed! Please check the error above."
    exit 1
fi
