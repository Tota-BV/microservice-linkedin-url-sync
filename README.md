# LinkedIn URL Sync Microservice

A simple microservice for syncing LinkedIn profile data to enrich existing candidate profiles.

## 🎯 **What This Does**

This microservice follows a specific workflow:
1. **Fetch LinkedIn data** (cache first, then RapidAPI)
2. **Ensure skills exist** in database (normalize, match, create idempotently)
3. **Map LinkedIn → internal model**
4. **Link skills to candidate** (idempotent)
5. **Insert related data** (verification, languages, education, certifications)

**Note**: This service only enriches existing profiles. You must create the basic candidate profile in your main application first.

## 🚀 **Quick Start for Local Testing**

### **Option 1: Local Code + Railway Database (Recommended)**

1. **Set up environment variables:**
   ```bash
   # .env.local
   DATABASE_URL=your-railway-postgresql-url
   RAPIDAPI_KEY=your-rapidapi-key
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Run locally:**
   ```bash
   bun run dev
   ```

4. **Test endpoints:**
   - Health: `GET http://localhost:3000/health`
   - Single sync: `POST http://localhost:3000/api/linkedin/sync`
   - Bulk sync: `POST http://localhost:3000/api/linkedin/sync-bulk`

### **Option 2: Full Local Stack**

1. **Start local database:**
   ```bash
   docker-compose up postgres -d
   ```

2. **Set environment:**
   ```bash
   # .env.local
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/tota_db
   RAPIDAPI_KEY=your-rapidapi-key
   ```

3. **Run service:**
   ```bash
   bun run dev
   ```

## 📊 **API Endpoints**

### **Health Check**
```bash
GET /health
```

### **Single LinkedIn Sync**
```bash
POST /api/linkedin/sync
Content-Type: application/json

{
  "linkedinUrl": "https://linkedin.com/in/username"
}
```

### **Bulk LinkedIn Sync**
```bash
POST /api/linkedin/sync-bulk
Content-Type: application/json

{
  "linkedinUrls": [
    "https://linkedin.com/in/username1",
    "https://linkedin.com/in/username2"
  ]
}
```

## 🔧 **Development**

### **Scripts**
- `bun run dev` - Start development server
- `bun run start` - Start production server
- `bun run build` - Build TypeScript

### **Database Schema**
The service expects these tables to exist:
- `candidates` - Basic candidate profiles
- `skills` - Available skills
- `candidate_skills` - Skills linked to candidates
- `education` - Education history
- `certifications` - Professional certifications
- `languages` - Language proficiencies
- `verification` - Work verification

## 🚀 **Deployment**

### **Railway (Simple)**
1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### **Docker**
```bash
docker build -t linkedin-sync .
docker run -p 3000:3000 -e DATABASE_URL=... -e RAPIDAPI_KEY=... linkedin-sync
```

## 📝 **Environment Variables**

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `RAPIDAPI_KEY` | RapidAPI key for LinkedIn data | Yes |
| `PORT` | Server port (default: 3000) | No |

## 🎯 **Testing Strategy**

**For fast iteration:**
1. Use Railway database directly from local code
2. No need to deploy for every test
3. Real data, real database, instant feedback

**For production testing:**
1. Deploy to Railway staging environment
2. Test with real data
3. Deploy to production when ready

## 🔍 **Troubleshooting**

### **Common Issues**
- **"Candidate not found"** - Create basic profile in main app first
- **Database connection failed** - Check `DATABASE_URL` format
- **RapidAPI errors** - Verify `RAPIDAPI_KEY` is valid

### **Logs**
The service provides detailed logging for debugging:
- Request/response details
- Database operation results
- Cache hit/miss information
- Error details with context

## 📚 **Architecture**

- **Simple HTTP server** - No complex frameworks
- **Repository pattern** - Clean database operations
- **File-based caching** - Simple LinkedIn data caching
- **RapidAPI integration** - LinkedIn profile fetching
- **Idempotent operations** - Safe to run multiple times

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with Railway database
5. Submit a pull request

---

**Built for speed and simplicity.** Test fast, deploy when ready.
