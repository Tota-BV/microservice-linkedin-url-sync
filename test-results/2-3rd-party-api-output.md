# 3rd Party API Output (RapidAPI LinkedIn)

## 📡 API Details:
- **Provider**: RapidAPI Professional Network Data
- **Endpoint**: `https://professional-network-data.p.rapidapi.com/get-profile-data-by-url`
- **Authentication**: X-RapidAPI-Key header

## 📋 Sample API Response:

```json
{
  "id": 19186432,
  "urn": "ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ",
  "username": "satyanadella",
  "firstName": "Satya",
  "lastName": "Nadella",
  "isTopVoice": true,
  "isCreator": false,
  "isPremium": true,
  "profilePicture": "https://media.licdn.com/dms/image/v2/C5603AQHHUuOSlRVA1w/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1579726625483?e=1757548800&v=beta&t=_uNC5PjbQoHG39E6046cf6ToiesFm_IspCmHAo5r3io",
  "summary": "As chairman and CEO of Microsoft, I define my mission and that of my company as empowering every person and every organization on the planet to achieve more.",
  "headline": "Chairman and CEO at Microsoft",
  "geo": {
    "country": "United States",
    "city": "Redmond",
    "full": "Redmond, Washington, United States",
    "countryCode": "US"
  },
  "position": [
    {
      "companyName": "Microsoft",
      "title": "Chairman and CEO",
      "location": "Redmond, Washington, United States",
      "description": "Leading Microsoft's mission to empower every person and every organization on the planet to achieve more.",
      "start": {
        "year": 2014,
        "month": 2,
        "day": 4
      },
      "end": null
    }
  ],
  "skills": [
    {
      "name": "Leadership",
      "passedSkillAssessment": true,
      "endorsementsCount": 150
    },
    {
      "name": "Strategic Planning",
      "passedSkillAssessment": false,
      "endorsementsCount": 89
    }
  ],
  "educations": [
    {
      "schoolName": "The University of Chicago Booth School of Business",
      "degree": "Master of Business Administration",
      "fieldOfStudy": "Business Administration",
      "start": {
        "year": 1994,
        "month": 9,
        "day": 1
      },
      "end": {
        "year": 1996,
        "month": 6,
        "day": 30
      }
    }
  ]
}
```

## 🔍 Key Data Fields:

### **Profile Information:**
- `id`: LinkedIn profile ID
- `urn`: Unique Resource Name
- `firstName`, `lastName`: Basic profile info
- `isTopVoice`, `isCreator`, `isPremium`: LinkedIn badges
- `profilePicture`: Profile image URL
- `summary`: Bio/description
- `headline`: Current job title

### **Location:**
- `geo.country`: Country
- `geo.city`: City
- `geo.full`: Full location string
- `geo.countryCode`: ISO country code

### **Work Experience:**
- `position[]`: Array of work positions
  - `companyName`: Company name
  - `title`: Job title
  - `location`: Work location
  - `description`: Job description
  - `start`: Start date (year, month, day)
  - `end`: End date (null for current)

### **Skills:**
- `skills[]`: Array of skills
  - `name`: Skill name
  - `passedSkillAssessment`: LinkedIn skill assessment passed
  - `endorsementsCount`: Number of endorsements

### **Education:**
- `educations[]`: Array of education
  - `schoolName`: Institution name
  - `degree`: Degree type
  - `fieldOfStudy`: Field of study
  - `start`, `end`: Education period

## 📊 Data Quality:
- **Completeness**: Varies by profile privacy settings
- **Accuracy**: Generally high, depends on user input
- **Freshness**: Real-time from LinkedIn
- **Rate Limits**: 1000 requests/month (RapidAPI plan dependent)
