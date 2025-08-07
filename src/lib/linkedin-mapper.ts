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

// Map LinkedIn data to your candidate schema
export function mapLinkedInToCandidate(linkedinData: LinkedInProfileData, linkedinUrl: string) {
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

  return {
    // Required fields from your candidate schema
    firstName: linkedinData.firstName || '',
    lastName: linkedinData.lastName || '',
    email: email,
    dateOfBirth: new Date('1990-01-01'), // Default date, you might want to extract from bio
    
    // Optional fields
    linkedinUrl: linkedinUrl,
    profileImageUrl: linkedinData.profilePicture || null,
    workingLocation: location,
    bio: linkedinData.summary || '',
    generalJobTitle: currentPosition?.title || '',
    currentCompany: currentPosition?.companyName || '',
    
    // Additional data for reference
    _rawLinkedInData: {
      headline: linkedinData.headline,
      skills: skills,
      isTopVoice: linkedinData.isTopVoice,
      isPremium: linkedinData.isPremium,
      totalPositions: linkedinData.position?.length || 0,
      totalSkills: skills.length,
      location: location
    }
  };
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
