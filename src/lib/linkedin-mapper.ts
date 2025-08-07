// Map RapidAPI LinkedIn data to your candidate database schema
export interface LinkedInProfileData {
  id?: number;
  urn?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isTopVoice?: boolean;
  isCreator?: boolean;
  isPremium?: boolean;
  profilePicture?: string;
  summary?: string;
  headline?: string;
  geo?: {
    country?: string;
    city?: string;
    full?: string;
    countryCode?: string;
  };
  position?: Array<{
    companyName?: string;
    title?: string;
    location?: string;
    description?: string;
    start?: { year?: number; month?: number; day?: number };
    end?: { year?: number; month?: number; day?: number };
  }>;
  skills?: Array<{
    name?: string;
    passedSkillAssessment?: boolean;
    endorsementsCount?: number;
  }>;
  educations?: Array<{
    schoolName?: string;
    degree?: string;
    fieldOfStudy?: string;
    start?: { year?: number; month?: number; day?: number };
    end?: { year?: number; month?: number; day?: number };
  }>;
}

// Updated response structure for main app consumption
export interface LinkedInSyncResponse {
  success: boolean;
  source: 'cache' | 'api';
  data: {
    // Candidate profile data (ready for insertion)
    candidate: {
      firstName: string;
      lastName: string;
      email: string;
      dateOfBirth: string;
      linkedinUrl: string;
      profileImageUrl: string;
      workingLocation: string;
      bio: string;
      generalJobTitle: string;
      currentCompany: string;
      category: string | null;
      isActive: boolean;
      education: Array<{
        degreeTitle: string;
        startYear: number;
        endYear: number | null;
        institution: string;
        location: string | null;
      }>;
      skills: Array<{
        skillId: string | null;
        skillName: string;
        isCore: boolean;
        endorsementsCount: number;
        skillType: string;
        source: 'linkedin';
        needsCreation: boolean;
      }>;
      verification: Array<{
        jobTitle: string;
        companyName: string;
        startYear: number;
        endYear: number | null;
        description: string[];
        order: number;
      }>;
      availability: {
        available: boolean;
        workingHoursDetail: {
          monday: { from: string; to: string };
          tuesday: { from: string; to: string };
          wednesday: { from: string; to: string };
          thursday: { from: string; to: string };
          friday: { from: string; to: string };
        };
        timezoneOffset: string;
        hoursMin: number;
        hoursMax: number;
        hourlyRateMin: number;
        hourlyRateMax: number;
      };
      languages: Array<{
        language: string;
        proficiency: string;
      }>;
      certifications: Array<{
        name: string;
        issuer: string;
        issueDate: string;
        expiryDate: string | null;
      }>;
      _rawLinkedInData: any;
    };
    // Skills that need to be created (main app responsibility)
    newSkills: Array<{
      skillName: string;
      source: 'linkedin';
    }>;
    // Skills that already exist (main app can look up IDs)
    existingSkills: Array<{
      skillName: string;
      source: 'linkedin';
    }>;
  };
  validation: {
    isValid: boolean;
    errors: string[];
  };
  metadata: {
    linkedinUrl: string;
    processedAt: string;
    totalPositions: number;
    totalSkills: number;
    newSkillsCount: number;
    existingSkillsCount: number;
  };
}

// Map LinkedIn data to your complete candidate schema
export async function mapLinkedInToCandidate(
	linkedinData: any,
	linkedinUrl: string
): Promise<LinkedInSyncResponse> {
	try {
		// Map skills with database lookup (READ ONLY)
		const mappedSkills = await mapSkills(linkedinData.skills);
  
		// Separate new and existing skills based on database lookup
		const newSkills = mappedSkills
			.filter(skill => skill.needsCreation)
			.map(skill => ({
				skillName: skill.skillName,
				source: 'linkedin' as const
			}));
			
		const existingSkills = mappedSkills
			.filter(skill => !skill.needsCreation)
			.map(skill => ({
				skillName: skill.skillName,
				source: 'linkedin' as const
			}));

		// Map candidate data
		const candidate = {
			firstName: linkedinData.firstName || "",
			lastName: linkedinData.lastName || "",
			email: linkedinData.email || "",
			dateOfBirth: (extractDateOfBirth(linkedinData.bio) || "1990-01-01T00:00:00.000Z").toString(),
			linkedinUrl: linkedinUrl,
			profileImageUrl: linkedinData.profileImageUrl || "",
			workingLocation: linkedinData.location || "",
			bio: linkedinData.bio || "",
			generalJobTitle: linkedinData.headline || "",
			currentCompany: linkedinData.currentCompany || "",
			category: determineCategory(linkedinData.headline),
			isActive: true,
			education: mapEducation(linkedinData.education),
			skills: mappedSkills,
			verification: mapVerification(linkedinData.positions),
			availability: mapAvailability(),
			languages: mapLanguages(linkedinData.languages),
			certifications: mapCertifications(linkedinData.certifications),
			_rawLinkedInData: linkedinData
		};

		return {
			success: true,
			source: 'api',
			data: {
				candidate,
				newSkills,
				existingSkills
			},
			validation: {
				isValid: true,
				errors: []
			},
			metadata: {
				linkedinUrl,
				processedAt: new Date().toISOString(),
				totalPositions: linkedinData.totalPositions || 0,
				totalSkills: mappedSkills.length,
				newSkillsCount: newSkills.length,
				existingSkillsCount: existingSkills.length
			}
		};
	} catch (error) {
		console.error("Error mapping LinkedIn data:", error);
		return {
			success: false,
			source: 'api',
			data: {
				candidate: {} as any,
				newSkills: [],
				existingSkills: []
			},
			validation: {
				isValid: false,
				errors: [error instanceof Error ? error.message : "Unknown error"]
			},
			metadata: {
				linkedinUrl,
				processedAt: new Date().toISOString(),
				totalPositions: 0,
				totalSkills: 0,
				newSkillsCount: 0,
				existingSkillsCount: 0
			}
		};
	}
}

// Map education data
function mapEducation(educations?: Array<any>) {
  if (!educations || educations.length === 0) return [];
  
  return educations.map(edu => ({
    degreeTitle: edu.degree || edu.fieldOfStudy || 'Degree',
    startYear: edu.start?.year || 2020,
    endYear: edu.end?.year || 2024,
    institution: edu.schoolName || 'University',
    location: null
  }));
}

import { findSkillByName, createSkill } from "./database";

// Map skills data to match candidates_skills table structure (READ-ONLY DATABASE)
async function mapSkills(skills?: Array<any>): Promise<Array<{
  skillId: string | null;
  skillName: string;
  isCore: boolean;
  endorsementsCount: number;
  skillType: string;
  source: 'linkedin';
  needsCreation: boolean;
}>> {
  if (!skills || skills.length === 0) return [];
  
  const mappedSkills = [];
  
  for (const skill of skills) {
    const skillName = skill.name;
    const skillType = determineSkillType(skillName);
    
    // Check if skill exists in database (READ ONLY)
    const existingSkill = await findSkillByName(skillName);
    
    if (existingSkill) {
      // Skill exists, use existing ID
      mappedSkills.push({
        skillId: existingSkill.id,
        skillName: skillName,
        isCore: skill.passedSkillAssessment || false,
        endorsementsCount: skill.endorsementsCount || 0,
        skillType: skillType,
        source: 'linkedin' as const,
        needsCreation: false
      });
      console.log(`📋 Found existing skill: ${skillName} (ID: ${existingSkill.id})`);
    } else {
      // Skill doesn't exist, mark for creation by main app
      mappedSkills.push({
        skillId: null,
        skillName: skillName,
        isCore: skill.passedSkillAssessment || false,
        endorsementsCount: skill.endorsementsCount || 0,
        skillType: skillType,
        source: 'linkedin' as const,
        needsCreation: true
      });
      console.log(`🆕 New skill identified: ${skillName} (needs creation by main app)`);
    }
  }
  
  return mappedSkills;
}

// Determine skill type based on skill name
function determineSkillType(skillName: string): string {
  const skill = skillName.toLowerCase();
  
  // Language skills
  if (['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'typescript'].includes(skill)) {
    return 'language';
  }
  
  // Library/Framework skills
  if (['react', 'vue', 'angular', 'node.js', 'express', 'django', 'spring', 'laravel', 'jquery', 'bootstrap', 'tailwind'].includes(skill)) {
    return 'library';
  }
  
  // Storage skills
  if (['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'firebase', 'aws', 'azure', 'gcp'].includes(skill)) {
    return 'storage';
  }
  
  // Tool skills
  if (['git', 'docker', 'kubernetes', 'jenkins', 'jira', 'figma', 'adobe', 'photoshop', 'illustrator'].includes(skill)) {
    return 'tool';
  }
  
  // Default to other
  return 'other';
}

// Map verification data (work experience)
function mapVerification(positions?: Array<any>) {
  if (!positions || positions.length === 0) return [];
  
  return positions.map((pos, index) => ({
    jobTitle: pos.title || '',
    companyName: pos.companyName || '',
    startYear: pos.start?.year || 2020,
    endYear: pos.end?.year || null,
    description: pos.description ? [pos.description] : [],
    order: index
  }));
}

// Map availability (default working hours)
function mapAvailability() {
  return {
    available: true,
    workingHoursDetail: {
      monday: { from: "08:00", to: "18:00" },
      tuesday: { from: "08:00", to: "18:00" },
      wednesday: { from: "08:00", to: "18:00" },
      thursday: { from: "08:00", to: "18:00" },
      friday: { from: "08:00", to: "18:00" }
    },
    timezoneOffset: "+01:00",
    hoursMin: 32,
    hoursMax: 40,
    hourlyRateMin: 50,
    hourlyRateMax: 100
  };
}

// Map languages (extract from bio)
function mapLanguages(bio?: string) {
  if (!bio) return [];
  
  const commonLanguages = ['English', 'Dutch', 'German', 'French', 'Spanish'];
  const foundLanguages = commonLanguages.filter(lang => 
    bio.toLowerCase().includes(lang.toLowerCase())
  );
  
  return foundLanguages.map(lang => ({
    language: lang,
    proficiency: 'professional' as const
  }));
}

// Map certifications (extract from bio)
function mapCertifications(bio?: string): Array<{
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
}> {
  if (!bio) return [];
  
  const certificationKeywords = ['certified', 'certification', 'certificate', 'diploma'];
  const hasCertifications = certificationKeywords.some(keyword => 
    bio.toLowerCase().includes(keyword)
  );
  
  if (hasCertifications) {
    return [{
      name: 'Professional Certification',
      issuer: 'LinkedIn',
      issueDate: '2020-01-01',
      expiryDate: null
    }];
  }
  
  return [];
}

// Extract date of birth from bio
function extractDateOfBirth(bio?: string): Date | null {
  if (!bio) return null;
  
  // Look for age patterns like "25 years old" or "born in 1995"
  const ageMatch = bio.match(/(\d+)\s*years?\s*old/);
  const bornMatch = bio.match(/born\s+in\s+(\d{4})/);
  
  if (bornMatch) {
    return new Date(parseInt(bornMatch[1]), 0, 1);
  }
  
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    const currentYear = new Date().getFullYear();
    return new Date(currentYear - age, 0, 1);
  }
  
  return null;
}

// Determine candidate category based on job title and skills
function determineCategory(jobTitle?: string, skills: string[] = []): string | null {
  if (!jobTitle && skills.length === 0) return null;
  
  const title = (jobTitle || '').toLowerCase();
  const skillString = skills.join(' ').toLowerCase();
  
  // Developer category
  if (title.includes('developer') || title.includes('engineer') || title.includes('programmer') ||
      skillString.includes('javascript') || skillString.includes('python') || skillString.includes('java')) {
    return 'developer';
  }
  
  // Cyber category
  if (title.includes('security') || title.includes('cyber') || title.includes('penetration') ||
      skillString.includes('security') || skillString.includes('cyber')) {
    return 'cyber';
  }
  
  // Designer category
  if (title.includes('designer') || title.includes('ui') || title.includes('ux') ||
      skillString.includes('figma') || skillString.includes('adobe')) {
    return 'designer';
  }
  
  // Project Manager category
  if (title.includes('project') || title.includes('manager') || title.includes('scrum') ||
      skillString.includes('agile') || skillString.includes('scrum')) {
    return 'project_manager';
  }
  
  // Product Owner category
  if (title.includes('product') || title.includes('owner') || title.includes('po')) {
    return 'product_owner';
  }
  
  return null;
}

// Validate if the mapped data has required fields
export function validateCandidateData(candidateData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!candidateData.firstName) errors.push('firstName is required');
  if (!candidateData.lastName) errors.push('lastName is required');
  if (!candidateData.email) errors.push('email is required');
  if (!candidateData.dateOfBirth) errors.push('dateOfBirth is required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Extract additional metadata from LinkedIn data
export function extractLinkedInMetadata(linkedinData: LinkedInProfileData) {
  return {
    profileId: linkedinData.id,
    urn: linkedinData.urn,
    username: linkedinData.username,
    isTopVoice: linkedinData.isTopVoice,
    isCreator: linkedinData.isCreator,
    isPremium: linkedinData.isPremium,
    location: linkedinData.geo?.full,
    country: linkedinData.geo?.country,
    city: linkedinData.geo?.city,
    totalPositions: linkedinData.position?.length || 0,
    totalSkills: linkedinData.skills?.length || 0,
    totalEducations: linkedinData.educations?.length || 0,
    skillsWithEndorsements: linkedinData.skills?.map(skill => ({
      name: skill.name,
      endorsements: skill.endorsementsCount
    })) || []
  };
}
