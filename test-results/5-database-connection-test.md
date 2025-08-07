# Database Connection Test

## Test Staging Database Connection

### Connection String
```
postgresql://[REDACTED]
```

### Test Commands
```bash
# List tables
psql "postgresql://[REDACTED]" -c "\dt"

# Check skills table
psql "postgresql://[REDACTED]" -c "SELECT * FROM skills LIMIT 5;"

# Check table structure
psql "postgresql://[REDACTED]" -c "\d skills"
```

### Environment Variables
```bash
# Set production database URL
DATABASE_URL_PRODUCTION=postgresql://[REDACTED]
```

## Results
- ✅ Database connection successful
- ✅ Skills table exists
- ✅ Can query skills data
