# Database Connection Test

## Database URL
```
postgresql://postgres:dp5pqu75t6shqs7u0d9npb1j2tvkgd7z@pgvector.railway.internal:5432/railway
```

## Test Script
```bash
# Test database connection
psql "postgresql://postgres:dp5pqu75t6shqs7u0d9npb1j2tvkgd7z@pgvector.railway.internal:5432/railway" -c "\dt"

# Check skills table
psql "postgresql://postgres:dp5pqu75t6shqs7u0d9npb1j2tvkgd7z@pgvector.railway.internal:5432/railway" -c "SELECT * FROM skills LIMIT 5;"

# Check table structure
psql "postgresql://postgres:dp5pqu75t6shqs7u0d9npb1j2tvkgd7z@pgvector.railway.internal:5432/railway" -c "\d skills"
```

## Railway Environment Variables
```bash
# Voor microservice (confident-ambition)
NODE_ENV=production
DATABASE_URL_PRODUCTION=postgresql://postgres:dp5pqu75t6shqs7u0d9npb1j2tvkgd7z@pgvector.railway.internal:5432/railway
RAPIDAPI_KEY=jouw_rapidapi_key_hier
```

## Volgende stappen
1. ✅ Database URL gekopieerd
2. 🔄 Environment variables instellen in Railway
3. 🔄 Database connection testen
4. 🔄 Microservice deployen en testen
