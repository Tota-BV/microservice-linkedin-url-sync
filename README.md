# LinkedIn URL Sync Microservice

A microservice for scraping LinkedIn profiles and syncing data to your database.

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database
REDIS_URL=redis://localhost:6379

# Auth
BETTER_AUTH_SECRET=your-secret-key

# SMTP
SMTP_URL=smtp://localhost
SMTP_PORT=587

# RapidAPI Configuration
RAPIDAPI_KEY=your-rapidapi-key-here
RAPIDAPI_HOST=professional-network-data.p.rapidapi.com

# Cache Configuration
CACHE_EXPIRATION_DAYS=30
CACHE_DIR=./src/cache/linkedin-profiles
```

## API Endpoints

- `POST /api/trpc/linkedin.sync` - Sync single or multiple LinkedIn URLs
- `GET /health` - Health check endpoint

## Development

```bash
bun install
bun run dev
```
