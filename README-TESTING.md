# 🧪 Testing Guide

**Real integration testing for your LinkedIn sync workflow.**

## 🚀 **Real Integration Testing (Recommended)**

**This approach tests the complete workflow end-to-end with real data:**

### **1. Setup Test Data**
```bash
# Create test agency and candidates from linkedin_urls.txt
bun run setup:test-data
```

### **2. Run Integration Test**
```bash
# Test complete workflow with real candidates
bun run test:integration
```

**What this does:**
- ✅ Creates test agency and candidates in your database
- ✅ Calls your microservice with real LinkedIn URLs
- ✅ Verifies data actually gets processed and stored
- ✅ Tests the complete workflow end-to-end

## 🔧 **Individual Step Testing (For Debugging)**

**Use these when you need to debug specific components:**

```bash
# Test database connection
bun run test:db

# Test RapidAPI access  
bun run test:rapidapi

# Test data mapping
bun run test:mapping

# Test skills processing
bun run test:skills

# Test skills linking
bun run test:linking

# Test related data insertion
bun run test:data

# Test profile update
bun run test:profile

# Test everything
bun run test:all
```

## 📋 **What Each Test Does**

### **Integration Test (Real Workflow)**
1. **Setup** - Creates test agency and candidates from `linkedin_urls.txt`
2. **Database Connection** - Verifies database connectivity
3. **RapidAPI Fetching** - Tests LinkedIn data fetching with real URLs
4. **Data Mapping** - Tests data transformation with real data
5. **Skills Processing** - Tests skills workflow with real candidates
6. **Database Verification** - Confirms data actually gets stored

### **Individual Step Tests (Component Testing)**
- **`test:db`** - Can your service connect to the database?
- **`test:rapidapi`** - Can you reach RapidAPI and fetch LinkedIn data?
- **`test:mapping`** - Can you transform LinkedIn data to your internal models?
- **`test:skills`** - Can you process skills (normalize → match → create)?
- **`test:linking`** - Can you link processed skills to candidates?
- **`test:data`** - Can you insert education, certifications, languages, verification?
- **`test:profile`** - Can you update candidate profiles with LinkedIn data?

## 🎯 **When to Use Each Approach**

### **Use Integration Testing When:**
- ✅ **Before deployment** - Verify everything works end-to-end
- ✅ **After major changes** - Ensure workflow still functions
- ✅ **Quality assurance** - Confirm data actually gets processed and stored

### **Use Individual Step Testing When:**
- 🔍 **Debugging specific issues** - Isolate problems to specific components
- 🛠️ **During development** - Test individual pieces as you build them
- 🚨 **Troubleshooting failures** - Identify exactly where things break

## 💡 **Workflow**

### **1. First Time Setup**
```bash
# Start your service
bun run start

# Setup test data (creates agency + candidates)
bun run setup:test-data

# Run integration test
bun run test:integration
```

### **2. Regular Testing**
```bash
# Test complete workflow
bun run test:integration

# Or test individual steps if debugging
bun run test:db
bun run test:rapidapi
# etc.
```

## 🚨 **Common Issues**

### **No Test Candidates Found**
```bash
# Run setup first
bun run setup:test-data
```

### **Database Connection Failed**
```bash
# Check if database is running
docker ps | grep postgres

# Start database
docker-compose up -d db
```

### **Service Not Running**
```bash
# Start your service
bun run start
```

---

**Integration testing gives you confidence that your LinkedIn sync workflow actually works end-to-end with real data!**
