# LinkedIn URL Sync Microservice

A lightweight microservice for scraping LinkedIn profiles and syncing data to your database.

## Features

- ✅ **LinkedIn Profile Scraping** - Via RapidAPI Professional Network Data
- ✅ **Smart Caching** - Date-based caching with no deletion strategy
- ✅ **Bulk Processing** - Handle multiple URLs with rate limiting
- ✅ **Data Mapping** - Convert to your database schema format
- ✅ **REST API** - Simple HTTP endpoints for easy integration

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/linkedin/sync` - Sync single LinkedIn URL
- `POST /api/linkedin/sync-bulk` - Sync multiple LinkedIn URLs

## Environment Variables

```bash
RAPIDAPI_KEY=your-rapidapi-key-here
RAPIDAPI_HOST=professional-network-data.p.rapidapi.com
CACHE_EXPIRATION_DAYS=30
CACHE_DIR=./src/cache/linkedin-profiles
PORT=3001
```

## Development

```bash
bun install
bun run dev
```

## Deployment

Deployed on Railway with automatic GitHub integration.
