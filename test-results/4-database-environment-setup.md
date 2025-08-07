# Database Environment Setup

## Environment Variables

### Development
```bash
DATABASE_URL=postgresql://user:pass@db-host:5432/database
```

### Staging
```bash
DATABASE_URL_STAGING=postgresql://user:pass@staging-db-host:5432/staging_db
```

### Production
```bash
DATABASE_URL_PRODUCTION=postgresql://user:pass@prod-db-host:5432/prod_db
```

## Railway Deployment

### Set Environment Variables
```bash
# Set staging database URL
railway variables set DATABASE_URL_STAGING=postgresql://[REDACTED]

# Set production database URL  
railway variables set DATABASE_URL_PRODUCTION=postgresql://[REDACTED]

# Set NODE_ENV for staging
railway variables set NODE_ENV=staging
```

## Database Connection Test
```bash
# Test staging database connection
psql "postgresql://[REDACTED]" -c "\dt"
```
