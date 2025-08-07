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

// Map LinkedIn data to your complete candidate schema
export async function mapLinkedInToCandidate(linkedinData: LinkedInProfileData, linkedinUrl: string) {
  // Get current position (most recent)
  const currentPosition = linkedinData.position?.[0];
  
  // Extract skills as array of strings
  const skills = linkedinData.skills?.map(skill => skill.name).filter(Boolean) || [];
  
  // Get location from geo or current position
  const location = linkedinData.geo?.full || currentPosition?.location || '';
  
  // Create email from name (fallback)
  const email = linkedinData.firstName && linkedinData.lastName 
    ? `${linkedinData.firstName.toLowerCase()}.${linkedinData.lastName.toLowerCase()}@example.com`
    : '';

  // Extract date of birth from bio or use default
  const dateOfBirth = extractDateOfBirth(linkedinData.summary) || new Date('1990-01-01');

  // Determine category based on job title and skills
  const category = determineCategory(currentPosition?.title, skills.filter(Boolean) as string[]);

  return {
    // Required fields from your candidate schema
    firstName: linkedinData.firstName || '',
    lastName: linkedinData.lastName || '',
    email: email,
    dateOfBirth: dateOfBirth,
    
    // Optional fields from candidates table
    linkedinUrl: linkedinUrl,
    profileImageUrl: linkedinData.profilePicture || null,
    workingLocation: location,
    bio: linkedinData.summary || '',
    generalJobTitle: currentPosition?.title || '',
    currentCompany: currentPosition?.companyName || '',
    category: category,
    isActive: true,
    
    // Related data structures
    education: mapEducation(linkedinData.educations),
    skills: await mapSkills(linkedinData.skills),
    verification: mapVerification(linkedinData.position),
    availability: mapAvailability(),
    languages: mapLanguages(linkedinData.summary),
    certifications: mapCertifications(linkedinData.summary),
    
    // Additional metadata
    _rawLinkedInData: {
      headline: linkedinData.headline,
      skills: skills,
      isTopVoice: linkedinData.isTopVoice,
      isPremium: linkedinData.isPremium,
      totalPositions: linkedinData.position?.length || 0,
      totalSkills: skills.length,
      location: location,
      profileId: linkedinData.id,
      urn: linkedinData.urn,
      username: linkedinData.username
    }
  };
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

// Map skills data to match candidates_skills table structure with skill resolution
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
    
    // Try to find existing skill in database
    const existingSkill = await findSkillByName(skillName);
    
    mappedSkills.push({
      skillId: existingSkill?.id || null,
      skillName: skillName,
      isCore: skill.passedSkillAssessment || false,
      endorsementsCount: skill.endorsementsCount || 0,
      skillType: skillType,
      source: 'linkedin' as const,
      needsCreation: !existingSkill
    });
  }
  
  return mappedSkills;
}

// Find existing skill by name (placeholder - would need database connection)
async function findSkillByName(skillName: string): Promise<{ id: string; name: string; skillType: string } | null> {
  // This would typically query your skills table
  // For now, return null to indicate skill needs to be created
  return null;
}

// Create new skill (placeholder - would need database connection)
async function createSkill(skillName: string, skillType: string): Promise<string> {
  // This would typically insert into your skills table
  // For now, return a placeholder UUID
  return `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
function mapCertifications(bio?: string) {
  if (!bio) return [];
  
  const certificationKeywords = ['certified', 'certification', 'certificate', 'diploma'];
  const hasCertifications = certificationKeywords.some(keyword => 
    bio.toLowerCase().includes(keyword)
  );
  
  if (hasCertifications) {
    return [{
      title: 'Professional Certification',
      startYear: 2020,
      endYear: 2024
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
