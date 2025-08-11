// Cache data for LinkedIn profiles (sensitive data - not in git)
// This file should be added to .gitignore

export const cachedLinkedInData = {
  "https://www.linkedin.com/in/julian-klumpers-383a20145/": {
    // Sample data structure - replace with real cached data
    id: 123456,
    firstName: "Julian",
    lastName: "Klumpers",
    headline: "Software Engineer",
    skills: [
      {
        name: "JavaScript",
        passedSkillAssessment: true,
        endorsementsCount: 25,
      },
      {
        name: "React",
        passedSkillAssessment: false,
        endorsementsCount: 15,
      },
      {
        name: "TypeScript",
        passedSkillAssessment: true,
        endorsementsCount: 30,
      },
    ],
    position: [
      {
        companyName: "Tech Company",
        title: "Software Engineer",
        location: "Amsterdam, Netherlands",
        description: "Building amazing software solutions",
        start: {
          year: 2020,
          month: 1,
          day: 1,
        },
        end: null,
      },
    ],
  },
  "https://www.linkedin.com/in/satya-nadella/": {
    id: 19186432,
    firstName: "Satya",
    lastName: "Nadella",
    headline: "Chairman and CEO at Microsoft",
    skills: [
      {
        name: "Leadership",
        passedSkillAssessment: true,
        endorsementsCount: 150,
      },
      {
        name: "Strategic Planning",
        passedSkillAssessment: false,
        endorsementsCount: 89,
      },
      {
        name: "Cloud Computing",
        passedSkillAssessment: true,
        endorsementsCount: 120,
      },
      {
        name: "Artificial Intelligence",
        passedSkillAssessment: false,
        endorsementsCount: 95,
      },
      {
        name: "Business Strategy",
        passedSkillAssessment: true,
        endorsementsCount: 200,
      },
    ],
    position: [
      {
        companyName: "Microsoft",
        title: "Chairman and CEO",
        location: "Redmond, Washington, United States",
        description:
          "Leading Microsoft's mission to empower every person and every organization on the planet to achieve more.",
        start: {
          year: 2014,
          month: 2,
          day: 4,
        },
        end: null,
      },
    ],
  },
};

// Get cached data for a URL
export function getCachedData(linkedinUrl: string) {
  return cachedLinkedInData[linkedinUrl as keyof typeof cachedLinkedInData];
}

// Check if URL has cached data
export function hasCachedData(linkedinUrl: string): boolean {
  return linkedinUrl in cachedLinkedInData;
}
