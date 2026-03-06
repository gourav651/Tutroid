# Database Reset Script
# Run this to clear all users and start fresh
# WARNING: This will delete ALL data!

echo "🗑️ Clearing database..."
npx prisma db push --force-reset

echo "✅ Database cleared. Ready for fresh testing."
