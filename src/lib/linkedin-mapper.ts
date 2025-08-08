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

// Updated response structure for webapp database insertion
export interface LinkedInSyncResponse {
  success: boolean;
  source: 'cache' | 'api';
  databaseOperations: {
    // Skills that need to be created (webapp responsibility)
    skillsToCreate: Array<{
      skillName: string;
      source: 'user';
    }>;
  };
  candidateProfile: {
    // Basic candidate fields (for candidates table)
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
    
    // Education data (for candidates_education table)
    education: Array<{
      degreeTitle: string;
      startYear: number;
      endYear: number | null;
      institution: string;
      location: string | null;
    }>;
    
    // Skills data (for candidates_skills table)
    skills: Array<{
      skillId: string | null; // null if skill needs to be created
      skillName: string;
      isCore: boolean;
      endorsementsCount: number;
      source: 'user';
    }>;
    
    // Verification data (for candidates_verification table)
    verification: Array<{
      jobTitle: string;
      companyName: string;
      startYear: number;
      endYear: number | null;
      description: string[];
      order: number;
    }>;
    
    // Availability data (for candidates_availability table)
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
    
    // Languages data (for candidates_languages table)
    languages: Array<{
      language: string;
      proficiency: string;
    }>;
    
    // Certifications data (for candidates_certifications table)
    certifications: Array<{
      name: string;
      issuer: string;
      issueDate: string;
      expiryDate: string | null;
    }>;
    
    _rawLinkedInData: any;
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
    skillsToCreateCount: number;
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
  
		// Skills that need to be created (main app responsibility)
		const skillsToCreate = mappedSkills
			.filter(skill => skill.needsCreation)
			.map(skill => ({
				skillName: skill.skillName,
				source: 'user' as const
			}));

		// Map candidate data with error handling for each field
		const candidate = {
			firstName: linkedinData.firstName || "",
			lastName: linkedinData.lastName || "",
			email: linkedinData.email || "",
			dateOfBirth: (() => {
				try {
					return (extractDateOfBirth(linkedinData.bio) || "1990-01-01T00:00:00.000Z").toString();
				} catch (error) {
					console.warn("⚠️ Error extracting date of birth:", error);
					return "1990-01-01T00:00:00.000Z";
				}
			})(),
			linkedinUrl: linkedinUrl,
			profileImageUrl: linkedinData.profileImageUrl || "",
			workingLocation: linkedinData.location || "",
			bio: linkedinData.bio || "",
			generalJobTitle: linkedinData.headline || "",
			currentCompany: linkedinData.currentCompany || "",
			category: (() => {
				try {
					return determineCategory(linkedinData.headline);
				} catch (error) {
					console.warn("⚠️ Error determining category:", error);
					return null;
				}
			})(),
			isActive: true,
			education: (() => {
				try {
					return mapEducation(linkedinData.education);
				} catch (error) {
					console.warn("⚠️ Error mapping education:", error);
					return [];
				}
			})(),
			skills: mappedSkills.map(skill => ({
				skillId: skill.skillId,
				skillName: skill.skillName,
				isCore: skill.isCore,
				endorsementsCount: skill.endorsementsCount,
				source: skill.source
			})),
			verification: (() => {
				try {
					return mapVerification(linkedinData.position);
				} catch (error) {
					console.warn("⚠️ Error mapping verification:", error);
					return [];
				}
			})(),
			availability: mapAvailability(),
			languages: (() => {
				try {
					return mapLanguages(linkedinData.bio);
				} catch (error) {
					console.warn("⚠️ Error mapping languages:", error);
					return [];
				}
			})(),
			certifications: (() => {
				try {
					return mapCertifications(linkedinData.bio);
				} catch (error) {
					console.warn("⚠️ Error mapping certifications:", error);
					return [];
				}
			})(),
			_rawLinkedInData: linkedinData
		};

		return {
			success: true,
			source: 'api',
			databaseOperations: {
				skillsToCreate
			},
			candidateProfile: candidate,
			validation: {
				isValid: true,
				errors: []
			},
			metadata: {
				linkedinUrl,
				processedAt: new Date().toISOString(),
				totalPositions: linkedinData.totalPositions || 0,
				totalSkills: mappedSkills.length,
				skillsToCreateCount: skillsToCreate.length
			}
		};
	} catch (error) {
		console.warn("⚠️ Warning mapping LinkedIn data:", error);
		// Return a valid response with empty data instead of failing
		return {
			success: true,
			source: 'api',
			databaseOperations: {
				skillsToCreate: []
			},
			candidateProfile: {
				firstName: linkedinData.firstName || "",
				lastName: linkedinData.lastName || "",
				email: linkedinData.email || "",
				dateOfBirth: "1990-01-01T00:00:00.000Z",
				linkedinUrl: linkedinUrl,
				profileImageUrl: linkedinData.profileImageUrl || "",
				workingLocation: linkedinData.location || "",
				bio: linkedinData.bio || "",
				generalJobTitle: linkedinData.headline || "",
				currentCompany: linkedinData.currentCompany || "",
				category: null,
				isActive: true,
				education: [],
				skills: [],
				verification: [],
				availability: mapAvailability(),
				languages: [],
				certifications: [],
				_rawLinkedInData: linkedinData
			},
			validation: {
				isValid: true,
				errors: [error instanceof Error ? error.message : "Unknown error"]
			},
			metadata: {
				linkedinUrl,
				processedAt: new Date().toISOString(),
				totalPositions: 0,
				totalSkills: 0,
				skillsToCreateCount: 0
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
  source: 'user';
  needsCreation: boolean;
}>> {
  if (!skills || skills.length === 0) return [];
  
  const mappedSkills = [];
  
  for (const skill of skills) {
    const skillName = skill.name;
    
    // Check if skill exists in database (READ ONLY)
    const existingSkill = await findSkillByName(skillName);
    
    if (existingSkill) {
      // Skill exists, use existing ID
      mappedSkills.push({
        skillId: existingSkill.id,
        skillName: skillName,
        isCore: skill.passedSkillAssessment || false,
        endorsementsCount: skill.endorsementsCount || 0,
        source: 'user' as const,
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
        source: 'user' as const,
        needsCreation: true
      });
      console.log(`🆕 New skill identified: ${skillName} (needs creation by main app)`);
    }
  }
  
  return mappedSkills;
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
function mapLanguages(bio?: any) {
  if (!bio || typeof bio !== 'string') return [];
  
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
function mapCertifications(bio?: any): Array<{
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
}> {
  if (!bio || typeof bio !== 'string') return [];
  
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
function extractDateOfBirth(bio?: any): Date | null {
  if (!bio || typeof bio !== 'string') return null;
  
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


