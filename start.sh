#!/bin/bash

# Simple startup script for LinkedIn Sync Microservice

echo "🚀 Starting LinkedIn Sync Microservice..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Please create it with:"
    echo "   DATABASE_URL=your-railway-postgresql-url"
    echo "   RAPIDAPI_KEY=your-rapidapi-key"
    exit 1
fi

# Load environment variables
export $(cat .env.local | xargs)

# Check required variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is required in .env.local"
    exit 1
fi

if [ -z "$RAPIDAPI_KEY" ]; then
    echo "❌ RAPIDAPI_KEY is required in .env.local"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "🔗 Database: $DATABASE_URL"
echo "🔑 RapidAPI: ${RAPIDAPI_KEY:0:10}..."

# Start the service
echo "🚀 Starting service..."
bun run dev
