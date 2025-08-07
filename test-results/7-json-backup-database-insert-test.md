# JSON Backup & Database Insert Test

## 🎯 **Wat we aan het doen zijn:**

### **Implementatie:**
1. **JSON Volume Storage** - LinkedIn data opslaan in Railway volume
2. **Database Insert met Juiste Volgorde** - Skills eerst, dan candidate profile
3. **Fallback Strategie** - JSON backup als database faalt
4. **Mock Data Testing** - Satya Nadella profile voor testing

---

## 📋 **Nieuwe Endpoints:**

### **1. Mock Data Endpoint**
```bash
POST /api/linkedin/sync-mock
```
**Doel:** Testen met Satya Nadella data zonder RapidAPI calls
**Input:**
```json
{
  "linkedinUrl": "https://www.linkedin.com/in/satya-nadella/",
  "profileType": "satya-nadella"
}
```

### **2. Mock Data met Backup & Database Insert**
```bash
POST /api/linkedin/sync-mock-with-backup
```
**Doel:** Volledige test van JSON backup + database insert
**Input:** Zelfde als hierboven

### **3. Database Test Endpoint**
```bash
POST /api/test/database
```
**Doel:** Directe database test zonder LinkedIn data
**Input:**
```json
{
  "testType": "skill" | "candidate"
}
```

---

## 🔧 **Technische Implementatie:**

### **JSON Volume Storage** (`src/lib/volume-storage.ts`)
```typescript
// Slaat JSON op in Railway volume (/data)
await saveJsonToVolume(candidateData, linkedinUrl);
// Resultaat: /data/linkedin-2025-08-07T16-30-05-436Z-satya_nadella.json
```

### **Database Insert Volgorde** (`src/lib/database.ts`)
```typescript
// Stap 1: Skills eerst aanmaken
for (const skillToCreate of candidateData.databaseOperations.skillsToCreate) {
  await createSkill(skillToCreate.skillName, "linkedin");
}

// Stap 2: Candidate profile inserten
const candidateId = await createCandidate(candidateData.candidateProfile);

// Stap 3: Skills linken aan candidate
for (const skill of candidateData.candidateProfile.skills) {
  await linkSkillsToCandidate(candidateId, skill);
}
```

### **Mock Data** (`src/lib/mock-data.ts`)
```typescript
// Satya Nadella profile data
{
  "firstName": "Satya",
  "lastName": "Nadella",
  "headline": "Chairman and CEO at Microsoft",
  "skills": [
    { "name": "Leadership", "endorsementsCount": 150 },
    { "name": "Strategic Planning", "endorsementsCount": 89 },
    { "name": "Cloud Computing", "endorsementsCount": 120 },
    { "name": "Artificial Intelligence", "endorsementsCount": 95 },
    { "name": "Business Strategy", "endorsementsCount": 200 }
  ]
}
```

---

## 🧪 **Test Scenarios:**

### **Scenario 1: Mock Data Test**
```bash
curl -X POST "https://microservice-linkedin-url-sync-production.up.railway.app/api/linkedin/sync-mock" \
  -H "Content-Type: application/json" \
  -d '{"linkedinUrl": "https://www.linkedin.com/in/satya-nadella/", "profileType": "satya-nadella"}'
```

**Verwacht Resultaat:**
```json
{
  "success": true,
  "source": "mock",
  "databaseOperations": {
    "skillsToCreate": [
      { "skillName": "Leadership" },
      { "skillName": "Strategic Planning" },
      { "skillName": "Cloud Computing" },
      { "skillName": "Artificial Intelligence" },
      { "skillName": "Business Strategy" }
    ]
  },
  "candidateProfile": {
    "firstName": "Satya",
    "lastName": "Nadella",
    "linkedinUrl": "https://www.linkedin.com/in/satya-nadella/",
    "skills": [
      { "skillName": "Leadership", "skillId": null, "isCore": false, "endorsementsCount": 150 }
    ]
  }
}
```

### **Scenario 2: Database Insert Test**
```bash
curl -X POST "https://microservice-linkedin-url-sync-production.up.railway.app/api/test/database" \
  -H "Content-Type: application/json" \
  -d '{"testType": "skill"}'
```

**Verwacht Resultaat:**
```json
{
  "success": true,
  "testType": "skill",
  "skillId": "uuid-here",
  "message": "Skill created successfully"
}
```

### **Scenario 3: Volledige Backup + Database Test**
```bash
curl -X POST "https://microservice-linkedin-url-sync-production.up.railway.app/api/linkedin/sync-mock-with-backup" \
  -H "Content-Type: application/json" \
  -d '{"linkedinUrl": "https://www.linkedin.com/in/satya-nadella/", "profileType": "satya-nadella"}'
```

**Verwacht Resultaat:**
```json
{
  "success": true,
  "source": "mock",
  "jsonBackup": {
    "saved": true,
    "filepath": "/data/linkedin-2025-08-07T16-30-05-436Z-satya_nadella.json",
    "error": null
  },
  "databaseInsert": {
    "inserted": true,
    "candidateId": "uuid-here",
    "skillsCreated": 5,
    "skillsLinked": 5,
    "duplicate": false,
    "error": null
  }
}
```

---

## 🚨 **Problemen & Oplossingen:**

### **Rate Limit Probleem:**
- **Probleem:** RapidAPI blokkeert te veel requests
- **Oplossing:** Mock data gebruiken voor testing
- **Voordeel:** Geen kosten, snelle testing

### **Database Schema Probleem:**
- **Probleem:** Skills table bestaat mogelijk niet
- **Oplossing:** `checkDatabaseSchema()` functie
- **Fallback:** JSON backup als database faalt

### **Deployment Delay:**
- **Probleem:** Railway deployments duren soms lang
- **Oplossing:** Wachten en opnieuw proberen
- **Monitoring:** Health check om te zien of service draait

---

## 📊 **Voordelen van deze Aanpak:**

### **1. JSON Backup als Fallback**
- ✅ Data blijft beschikbaar als database faalt
- ✅ Geen data verlies
- ✅ Manual recovery mogelijk

### **2. Juiste Database Volgorde**
- ✅ Skills eerst (dependency)
- ✅ Candidate profile daarna
- ✅ Skills linken als laatste
- ✅ Transaction safety

### **3. Mock Data Testing**
- ✅ Geen RapidAPI kosten
- ✅ Snelle testing
- ✅ Betrouwbare test data
- ✅ Geen rate limits

### **4. Error Handling**
- ✅ Per stap apart error handling
- ✅ JSON backup werkt ook als database faalt
- ✅ Database insert werkt ook als JSON backup faalt
- ✅ Comprehensive error reporting

---

## 🎯 **Volgende Stappen:**

1. **Wachten op deployment** - Railway deployment voltooien
2. **Mock data testen** - `/api/linkedin/sync-mock` endpoint
3. **Database testen** - `/api/test/database` endpoint
4. **Volledige flow testen** - `/api/linkedin/sync-mock-with-backup`
5. **JSON backup controleren** - Volume storage testen
6. **Database resultaten controleren** - Skills en candidates in database

---

## 📝 **Status:**
- ✅ **Code geïmplementeerd**
- ✅ **Mock data toegevoegd**
- ✅ **Deployment gestart**
- ⏳ **Wachten op deployment completion**
- ⏳ **Testing van endpoints**
- ⏳ **Database insert verificatie**
