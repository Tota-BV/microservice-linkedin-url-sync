# Database Environment Setup

## Probleem
De `skills` tabel is niet altijd gesynchroniseerd tussen staging en production environments.

## Oplossing
De microservice ondersteunt nu environment-specific database URLs:

### Environment Variables Setup

#### Optie 1: Environment-specific databases (Aanbevolen)
```bash
# Voor staging environment
NODE_ENV=staging
DATABASE_URL_STAGING=postgresql://user:pass@staging-db-host:5432/staging_db

# Voor production environment  
NODE_ENV=production
DATABASE_URL_PRODUCTION=postgresql://user:pass@prod-db-host:5432/prod_db
```

#### Optie 2: Single database (Fallback)
```bash
# Voor beide environments
DATABASE_URL=postgresql://user:pass@db-host:5432/database
```

### Railway Configuration

#### Staging Environment
```bash
railway variables set NODE_ENV=staging
railway variables set DATABASE_URL_STAGING=postgresql://...
```

#### Production Environment  
```bash
railway variables set NODE_ENV=production
railway variables set DATABASE_URL_PRODUCTION=postgresql://...
```

### Database Synchronisatie

Om de `skills` tabel te synchroniseren tussen environments:

1. **Export skills van staging:**
```sql
COPY (SELECT * FROM skills WHERE is_active = true) TO '/tmp/staging_skills.csv' CSV HEADER;
```

2. **Import naar production:**
```sql
COPY skills FROM '/tmp/staging_skills.csv' CSV HEADER;
```

3. **Of via pg_dump/pg_restore:**
```bash
pg_dump -t skills staging_db > skills_backup.sql
psql production_db < skills_backup.sql
```

### Logging
De microservice logt nu welke database wordt gebruikt:
- `🔗 Using staging database`
- `🔗 Using production database`  
- `🔗 Using fallback database for [environment]`

### Voordelen
- ✅ Automatische database selectie op basis van environment
- ✅ Geen code changes nodig tussen staging/prod
- ✅ Fallback naar single database voor backward compatibility
- ✅ Duidelijke logging van welke database wordt gebruikt
