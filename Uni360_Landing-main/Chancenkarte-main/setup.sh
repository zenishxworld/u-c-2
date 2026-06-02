#!/bin/bash
# Quick Start Script for Chancenkarte PostgreSQL Setup
# Run this after fixing AWS RDS connectivity

echo "🚀 Chancenkarte PostgreSQL Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Quick connection test
echo "🔍 Testing database connection..."
npm run quick-test
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Database connection failed!"
    echo "   Please check:"
    echo "   1. AWS RDS security group allows port 5432"
    echo "   2. RDS instance has 'Publicly accessible' enabled"
    echo "   3. Database credentials are correct in .env"
    exit 1
fi
echo ""

# Initialize database
echo "📊 Initializing database tables..."
npm run init-db
if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi
echo ""

echo "✅ Setup complete!"
echo ""
echo "🎉 Next steps:"
echo "   1. Terminal 1: npm run server    (start backend)"
echo "   2. Terminal 2: npm run dev       (start frontend)"
echo "   3. Open: http://localhost:5173"
echo ""
