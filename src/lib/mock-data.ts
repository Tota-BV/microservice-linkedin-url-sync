// Mock LinkedIn data for testing (Satya Nadella profile)
export const mockLinkedInData = {
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
    },
    {
      "name": "Cloud Computing",
      "passedSkillAssessment": true,
      "endorsementsCount": 120
    },
    {
      "name": "Artificial Intelligence",
      "passedSkillAssessment": false,
      "endorsementsCount": 95
    },
    {
      "name": "Business Strategy",
      "passedSkillAssessment": true,
      "endorsementsCount": 200
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
};

// Mock data for different profiles
export const mockProfiles = {
  "satya-nadella": mockLinkedInData,
  "test-candidate": {
    ...mockLinkedInData,
    "firstName": "Test",
    "lastName": "Candidate",
    "username": "testcandidate",
    "headline": "Software Engineer at Test Company",
    "position": [
      {
        "companyName": "Test Company",
        "title": "Software Engineer",
        "location": "Amsterdam, Netherlands",
        "description": "Building amazing software solutions",
        "start": {
          "year": 2020,
          "month": 1,
          "day": 1
        },
        "end": null
      }
    ],
    "skills": [
      {
        "name": "JavaScript",
        "passedSkillAssessment": true,
        "endorsementsCount": 25
      },
      {
        "name": "React",
        "passedSkillAssessment": false,
        "endorsementsCount": 15
      },
      {
        "name": "TypeScript",
        "passedSkillAssessment": true,
        "endorsementsCount": 30
      }
    ]
  }
};

// Get mock data by profile type
export function getMockData(profileType: string = "satya-nadella") {
  return mockProfiles[profileType as keyof typeof mockProfiles] || mockLinkedInData;
}
