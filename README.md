# LinkedIn URL Sync Microservice

Een microservice voor het synchroniseren van LinkedIn profielen met bestaande candidate records in de database.

## 🚀 Features

- **LinkedIn Profile Sync**: Haalt LinkedIn data op via RapidAPI
- **Skills Processing**: Verwerkt en koppelt skills aan candidates
- **Education & Work Experience**: Synchroniseert opleiding en werkervaring
- **Idempotent**: Kan veilig meerdere keren worden uitgevoerd zonder duplicaten
- **Health Checks**: Railway-compatibele health check endpoint
- **Search API**: Zoek candidates op voornaam met alle gerelateerde data
- **Rate Limiting**: Automatische API throttling om quota te beschermen
- **Streaming Responses**: Memory-efficient processing van grote batches
- **Advanced Error Handling**: Specifieke error types en recovery mogelijkheden

## 🏗️ Architectuur

```
src/
├── index.ts                 # Main server & API endpoints
├── lib/
│   ├── core/
│   │   ├── data-mapper.ts   # LinkedIn data mapping
│   │   └── skills-processor.ts # Skills processing logic
│   ├── database.ts          # Database connection & queries
│   ├── rapidapi.ts          # RapidAPI LinkedIn integration
│   └── repositories/        # Data access layer
│       ├── skills-repository.ts
│       ├── skills-candidate-repository.ts
│       └── related-data-repository.ts
└── cache/                   # LinkedIn profile caching
```

## 🛠️ Setup

### Vereisten
- Node.js >= 22
- Bun >= 1.2.19
- PostgreSQL database
- RapidAPI key voor LinkedIn data

### Installatie

1. **Clone repository**
```bash
git clone <repository-url>
cd microservice-linkedin-url-sync
```

2. **Installeer dependencies**
```bash
bun install
```

3. **Environment variables instellen**
```bash
cp .env.example .env
# Vul in: DATABASE_URL, RAPIDAPI_KEY, PORT
```

4. **Database setup**
```bash
# Run database migrations
bun run db:migrate
```

5. **Start service**
```bash
# Development
bun run dev

# Production
bun run start
```

## 🌐 API Endpoints

### Health Check
```
GET /health
```

### Candidate Search
```
GET /api/candidates/search?firstName=<naam>
```

### Single LinkedIn Sync
```
POST /api/linkedin/sync
Content-Type: application/json

{
  "linkedinUrl": "https://www.linkedin.com/in/username/"
}
```

### Bulk LinkedIn Sync
```
POST /api/linkedin/sync-bulk
Content-Type: application/json

{
  "linkedinUrls": [
    "https://www.linkedin.com/in/user1/",
    "https://www.linkedin.com/in/user2/"
  ]
}
```

## 🚀 Deployment

### Railway Deployment
De service is geconfigureerd voor Railway deployment:

1. **railway.toml**: Build en deploy configuratie
2. **Dockerfile**: Container configuratie met Bun runtime
3. **Health checks**: Automatische health monitoring

### Environment Variables (Railway)
- `DATABASE_URL`: PostgreSQL connection string
- `RAPIDAPI_KEY`: RapidAPI key voor LinkedIn data
- `PORT`: Service port (Railway stelt dit automatisch in)

## 📊 Database Schema

### Hoofdtabellen
- `candidates`: Basis candidate informatie
- `skills`: Beschikbare skills
- `candidates_skills`: Koppeling tussen candidates en skills

### Gerelateerde tabellen
- `candidates_education`: Opleiding informatie
- `candidates_work_experience`: Werkervaring
- `candidates_certifications`: Certificeringen
- `candidates_languages`: Talen
- `candidates_verification`: Verificatie status

## 🔄 Sync Workflow

1. **Input**: LinkedIn URL van bestaande candidate
2. **Fetch**: Haal LinkedIn data op via RapidAPI
3. **Process**: Verwerk skills, education, work experience
4. **Update**: Update candidate record en gerelateerde tabellen
5. **Link**: Koppel skills aan candidate (idempotent)

## 🧪 Testing

### Lokaal testen
```bash
# Start service
bun run start

# Test health check
curl http://localhost:3000/health

# Test candidate search
curl "http://localhost:3000/api/candidates/search?firstName=Arnand"

# Test LinkedIn sync
curl -X POST http://localhost:3000/api/linkedin/sync \
  -H "Content-Type: application/json" \
  -d '{"linkedinUrl": "https://www.linkedin.com/in/arnandsiem/"}'
```

### Productie testen
Vervang `localhost:3000` door je Railway app URL.

## 📝 Logging

De service logt uitgebreid alle operaties:
- LinkedIn data fetching
- Database operaties
- Skills processing
- Error handling

## 🚨 Troubleshooting

### Veelvoorkomende problemen

1. **Database connectie mislukt**
   - Controleer `DATABASE_URL` in environment
   - Verifieer database toegankelijkheid

2. **RapidAPI errors**
   - Controleer `RAPIDAPI_KEY`
   - Verifieer API quota en rate limits

3. **Railway deployment faalt**
   - Check health check endpoint
   - Verifieer Dockerfile configuratie
   - Controleer Railway logs

## 🤝 Contributing

1. Fork de repository
2. Maak feature branch
3. Commit changes
4. Push naar branch
5. Maak Pull Request

## 📄 License

MIT License - zie LICENSE bestand voor details.

## 👥 Team

- **Arnand Siem** - Initiator & Lead Developer
- **Ricardo Pereira Rodrigues** - Backend Development
- **Bas Rienstra** - Frontend Integration
- **Ayman Berkane** - Testing & QA
- **Fons Thijssen** - DevOps & Deployment

## 📞 Support

Voor vragen of problemen:
- Open een GitHub issue
- Neem contact op met het development team
- Check Railway logs voor deployment issues

---

**Laatste update**: August 2025  
**Versie**: 1.0.0  
**Status**: Production Ready ✅
