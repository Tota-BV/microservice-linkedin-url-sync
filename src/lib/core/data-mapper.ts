// ============================================================================
// CORE: Data Mapping (LinkedIn → Internal Models)
// ============================================================================
// Purpose: Transform LinkedIn data to internal models - no database operations
// Input: Raw LinkedIn data
// Output: Mapped internal models

import type {
  LinkedInProfileData,
  MappedSkill,
  MappedEducation,
  MappedVerification,
  MappedWorkExperience,
  MappedLanguage,
  MappedCertification,
  MappedAvailability,
  MappedCandidateProfile,
} from "../types";

export interface MappingResult {
  success: boolean;
  mappedData?: MappedCandidateProfile;
  error?: string;
  metadata: {
    skillsCount: number;
    educationCount: number;
    workExperienceCount: number;
    verificationCount: number;
    languagesCount: number;
    certificationsCount: number;
    processedAt: string;
  };
}

export function mapLinkedInData(
  linkedinData: LinkedInProfileData,
  linkedinUrl: string,
  existingCandidate?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    workingLocation?: string;
    isActive?: boolean;
    verification?: MappedVerification[];
    availability?: MappedAvailability;
  },
): MappingResult {
  try {
    console.log(`🔄 [MAP] Starting data mapping for: ${linkedinUrl}`);
    console.log(`🔍 [MAP] Raw linkedinData type:`, typeof linkedinData);
    console.log(`🔍 [MAP] Raw linkedinData keys:`, Object.keys(linkedinData));
    console.log(`🔍 [MAP] Raw linkedinData structure:`, JSON.stringify(linkedinData, null, 2));

    // Extract the actual data from the nested structure
    // RapidAPI returns data in linkedinData.data, but our interface expects it directly
    const profileData = (linkedinData as any).data || linkedinData;
    
    console.log(`🔍 [MAP] Profile data extracted:`, {
      hasData: !!(linkedinData as any).data,
      dataKeys: Object.keys(linkedinData),
      profileDataKeys: Object.keys(profileData),
      profileDataStructure: JSON.stringify(profileData, null, 2)
    });
    
    console.log(`🔍 [MAP] Key fields for verification:`, {
      position: profileData.position,
      positionType: typeof profileData.position,
      positionLength: profileData.position?.length || 0,
      positionSample: profileData.position?.[0] || 'none',
      fullPositions: profileData.fullPositions,
      fullPositionsType: typeof profileData.fullPositions,
      fullPositionsLength: profileData.fullPositions?.length || 0,
      fullPositionsSample: profileData.fullPositions?.[0] || 'none'
    });

    console.log(`🔍 [MAP] Key fields for education:`, {
      educations: profileData.educations,
      educationsType: typeof profileData.educations,
      educationsLength: profileData.educations?.length || 0,
      educationsSample: profileData.educations?.[0] || 'none'
    });

    console.log(`🔍 [MAP] Key fields for skills:`, {
      skills: profileData.skills,
      skillsType: typeof profileData.skills,
      skillsLength: profileData.skills?.length || 0,
      skillsSample: profileData.skills?.[0] || 'none'
    });

    console.log(`🔍 [MAP] Key fields for languages:`, {
      languages: profileData.languages,
      languagesType: typeof profileData.languages,
      languagesLength: profileData.languages?.length || 0,
      languagesSample: profileData.languages?.[0] || 'none'
    });

    // Map all data components
    const mappedSkills = mapSkills(profileData.skills || []);
    const mappedEducation = mapEducation(profileData.educations || []);
    const mappedWorkExperience = mapWorkExperience(profileData.fullPositions || []);
    const mappedVerification = mapVerification([]); // Empty for now - verification is separate from work experience
    const mappedLanguages = mapLanguages(profileData.languages, profileData.skills);
    const mappedCertifications = mapCertifications(profileData.certifications);
    const mappedAvailability =
      existingCandidate?.availability || mapDefaultAvailability();

    const mappedProfile: MappedCandidateProfile = {
      // ❌ LinkedIn does NOT overwrite - preserve existing values from main app
      firstName: existingCandidate?.firstName || "",
      lastName: existingCandidate?.lastName || "",
      email: existingCandidate?.email || "",
      workingLocation: extractWorkingLocation(profileData) || existingCandidate?.workingLocation || "",
      isActive: existingCandidate?.isActive ?? true,
      availability: mappedAvailability,

      // ✅ LinkedIn CAN overwrite - use new values
      dateOfBirth: extractDateOfBirth(),
      linkedinUrl: linkedinUrl,
      profileImageUrl: profileData.profilePicture || "",
      bio: profileData.bio || profileData.summary || "",
      generalJobTitle: profileData.headline || "",
      currentCompany: extractCurrentCompany(profileData) || "",
      category: determineCategory(
        profileData.headline,
        mappedSkills.map((s) => s.skillName),
      ),
      education: mappedEducation,
      skills: mappedSkills,
      workExperience: mappedWorkExperience,
      verification: mappedVerification,
      languages: mappedLanguages,
      certifications: mappedCertifications,
    };

    console.log(`✅ [MAP] Data mapping completed successfully`);

    return {
      success: true,
      mappedData: mappedProfile,
      metadata: {
        skillsCount: mappedSkills.length,
        educationCount: mappedEducation.length,
        workExperienceCount: mappedWorkExperience.length,
        verificationCount: mappedVerification.length,
        languagesCount: mappedLanguages.length,
        certificationsCount: mappedCertifications.length,
        processedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error(`❌ [MAP] Data mapping failed:`, error);
    return {
      success: false,
      error: `Data mapping failed: ${error.message}`,
      metadata: {
        skillsCount: 0,
        educationCount: 0,
        workExperienceCount: 0,
        verificationCount: 0,
        languagesCount: 0,
        certificationsCount: 0,
        processedAt: new Date().toISOString(),
      },
    };
  }
}

// Helper mapping functions (pure functions, no database calls)
function mapSkills(
  skills: LinkedInProfileData["skills"],
): MappedSkill[] {
  if (!skills || skills.length === 0) return [];

  return skills.map((skill) => ({
    skillId: null, // Will be resolved by database layer
    skillName: skill.name || "Unknown Skill",
    isCore: skill.passedSkillAssessment || false,
    endorsementsCount: skill.endorsementsCount || 0,
    source: "user" as const,
    needsCreation: true, // All skills need database resolution
  }));
}

function mapEducation(
  educations: LinkedInProfileData["educations"],
): MappedEducation[] {
  if (!educations || educations.length === 0) return [];

  return educations.map((edu) => ({
    degreeTitle: edu.degree || edu.fieldOfStudy || "",
    startYear: edu.start?.year || 0,
    endYear: edu.end?.year || 0,
    institution: edu.schoolName || "",
    location: null,
  }));
}

function mapWorkExperience(
  workExperiences: LinkedInProfileData["fullPositions"],
): MappedWorkExperience[] {
  console.log(`🔍 [MAP-WORK-EXPERIENCE] Input work experiences:`, workExperiences);
  
  if (!workExperiences || workExperiences.length === 0) {
    console.log(`⚠️ [MAP-WORK-EXPERIENCE] No work experience data found`);
    return [];
  }

  console.log(`🔄 [MAP-WORK-EXPERIENCE] Processing ${workExperiences.length} work experiences`);
  
  const mapped = workExperiences.map((exp, index) => {
    // Improved description handling: check for meaningful content
    let description: string[] = [];
    if (exp.description && typeof exp.description === 'string') {
      const trimmedDescription = exp.description.trim();
      if (trimmedDescription.length > 0) {
        description = [trimmedDescription];
      }
    }
    
    const mapped = {
      jobTitle: exp.title || "",
      companyName: exp.companyName || "",
      startYear: exp.start?.year || 0,
      endYear: exp.end?.year || 0,
      description: description,
      order: index,
    };
    
    console.log(`📝 [MAP-WORK-EXPERIENCE] Work Experience ${index}:`, {
      original: { title: exp.title, companyName: exp.companyName, start: exp.start, end: exp.end, description: exp.description },
      mapped: mapped,
      descriptionProcessed: { original: exp.description, trimmed: exp.description?.trim(), final: description }
    });
    
    return mapped;
  });

  console.log(`✅ [MAP-WORK-EXPERIENCE] Mapped ${mapped.length} work experience records:`, mapped);
  return mapped;
}

function mapVerification(
  positions: LinkedInProfileData["fullPositions"],
): MappedVerification[] {
  console.log(`🔍 [MAP-VERIFICATION] Input positions:`, positions);
  
  if (!positions || positions.length === 0) {
    console.log(`⚠️ [MAP-VERIFICATION] No positions data found`);
    return [];
  }

  console.log(`🔄 [MAP-VERIFICATION] Processing ${positions.length} positions`);
  
  const mapped = positions.map((pos, index) => {
    // Improved description handling: check for meaningful content
    let description: string[] = [];
    if (pos.description && typeof pos.description === 'string') {
      const trimmedDescription = pos.description.trim();
      if (trimmedDescription.length > 0) {
        description = [trimmedDescription];
      }
    }
    
    const mapped = {
      jobTitle: pos.title || "",
      companyName: pos.companyName || "",
      startYear: pos.start?.year || 0,
      endYear: pos.end?.year || 0,
      description: description,
      order: index,
    };
    
    console.log(`📝 [MAP-VERIFICATION] Position ${index}:`, {
      original: { title: pos.title, companyName: pos.companyName, start: pos.start, end: pos.end, description: pos.description },
      mapped: mapped,
      descriptionProcessed: { original: pos.description, trimmed: pos.description?.trim(), final: description }
    });
    
    return mapped;
  });

  console.log(`✅ [MAP-VERIFICATION] Mapped ${mapped.length} verification records:`, mapped);
  return mapped;
}

function mapDefaultAvailability(): MappedAvailability {
  return {
    available: true,
    workingHoursDetail: {
      monday: { from: "08:00", to: "18:00" },
      tuesday: { from: "08:00", to: "18:00" },
      wednesday: { from: "08:00", to: "18:00" },
      thursday: { from: "08:00", to: "18:00" },
      friday: { from: "08:00", to: "18:00" },
    },
    timezoneOffset: "",
    hoursMin: 32,
    hoursMax: 40,
    hourlyRateMin: null,
    hourlyRateMax: null,
  };
}

export function mapLanguages(
  languages?: LinkedInProfileData["languages"],
  skills?: LinkedInProfileData["skills"],
): MappedLanguage[] {
  console.log(`🔍 [MAP-LANGUAGES] Starting language mapping`);
  console.log(`🔍 [MAP-LANGUAGES] Explicit languages:`, languages);
  console.log(`🔍 [MAP-LANGUAGES] Skills to check for languages:`, skills);
  
  const mappedLanguages: MappedLanguage[] = [];
  const processedLanguageNames = new Set<string>();

  // 1. Process explicit languages from LinkedIn
  if (languages && languages.length > 0) {
    console.log(`🔄 [MAP-LANGUAGES] Processing ${languages.length} explicit languages`);
    
    for (const lang of languages) {
      const languageName = lang.name?.trim();
      if (languageName && !processedLanguageNames.has(languageName.toLowerCase())) {
        mappedLanguages.push({
          language: languageName,
          proficiency: lang.proficiency || "professional",
        });
        processedLanguageNames.add(languageName.toLowerCase());
        console.log(`✅ [MAP-LANGUAGES] Added explicit language: ${languageName}`);
      }
    }
  }

  // 2. Extract languages from skills (common language names)
  if (skills && skills.length > 0) {
    console.log(`🔄 [MAP-LANGUAGES] Checking ${skills.length} skills for language names`);
    
    const languageKeywords = [
      // Major languages
      'english', 'dutch', 'german', 'french', 'spanish', 'italian', 'portuguese',
      'russian', 'chinese', 'japanese', 'korean', 'arabic', 'hindi', 'turkish',
      'polish', 'swedish', 'norwegian', 'danish', 'finnish', 'greek', 'hebrew',
      // Language variations
      'mandarin', 'cantonese', 'farsi', 'urdu', 'bengali', 'tamil', 'thai',
      'vietnamese', 'indonesian', 'malay', 'filipino', 'tagalog', 'swahili',
      // Regional variations
      'american english', 'british english', 'australian english',
      'flemish', 'swiss german', 'austrian german',
      'latin american spanish', 'castilian spanish',
      'brazilian portuguese', 'european portuguese'
    ];

    for (const skill of skills) {
      const skillName = skill.name?.trim().toLowerCase();
      if (!skillName) continue;

      // Check if skill name contains language keywords
      const isLanguage = languageKeywords.some(keyword => 
        skillName.includes(keyword) || keyword.includes(skillName)
      );

      if (isLanguage && !processedLanguageNames.has(skillName) && skill.name) {
        // Convert skill name to proper language name
        const properLanguageName = normalizeLanguageName(skill.name);
        
        mappedLanguages.push({
          language: properLanguageName,
          proficiency: "professional", // Default since it's from skills
        });
        
        processedLanguageNames.add(skillName);
        console.log(`✅ [MAP-LANGUAGES] Added language from skills: ${skill.name} → ${properLanguageName}`);
      }
    }
  }

  console.log(`✅ [MAP-LANGUAGES] Language mapping completed: ${mappedLanguages.length} languages found`);
  console.log(`📋 [MAP-LANGUAGES] Final languages:`, mappedLanguages);
  
  return mappedLanguages;
}

// Helper function to normalize language names
function normalizeLanguageName(skillName: string): string {
  const name = skillName.trim();
  
  // Common normalizations
  const normalizations: Record<string, string> = {
    'eng': 'English',
    'nl': 'Dutch',
    'de': 'German',
    'fr': 'French',
    'es': 'Spanish',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'pl': 'Polish',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'el': 'Greek',
    'he': 'Hebrew'
  };

  // Check for exact matches
  if (normalizations[name.toLowerCase()]) {
    return normalizations[name.toLowerCase()];
  }

  // Check for partial matches
  for (const [abbrev, fullName] of Object.entries(normalizations)) {
    if (name.toLowerCase().includes(abbrev) || abbrev.includes(name.toLowerCase())) {
      return fullName;
    }
  }

  // Capitalize first letter if it's a simple language name
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function mapCertifications(
  certifications?: LinkedInProfileData["certifications"],
): MappedCertification[] {
  if (!certifications || certifications.length === 0) {
    console.log(`⚠️ [MAP-CERTIFICATIONS] No certifications data available`);
    return [];
  }

  const mapped = certifications.map((cert, index) => {
    const mappedCert = {
      title: cert.name || "",
      startYear: cert.start?.year || 0,
      endYear: cert.end?.year || null,
    };

    console.log(`📜 [MAP-CERTIFICATIONS] Certification ${index}:`, {
      original: { name: cert.name, start: cert.start, end: cert.end, authority: cert.authority },
      mapped: mappedCert
    });

    return mappedCert;
  });

  console.log(`✅ [MAP-CERTIFICATIONS] Mapped ${mapped.length} certifications:`, mapped);
  return mapped;
}

function extractDateOfBirth(): string {
  // LinkedIn doesn't provide structured date of birth data
  return "";
}

function determineCategory(
  jobTitle?: string,
  skills: string[] = [],
): string | null {
  if (!jobTitle && skills.length === 0) return null;

  const title = (jobTitle || "").toLowerCase();

  // Simple direct matching
  if (title.includes("developer") || title.includes("engineer")) {
    return "developer";
  }

  if (title.includes("security") || title.includes("cyber")) {
    return "cyber";
  }

  if (title.includes("designer") || title.includes("design")) {
    return "designer";
  }

  if (title.includes("project") || title.includes("manager")) {
    return "project_manager";
  }

  if (title.includes("product") || title.includes("owner")) {
    return "product_owner";
  }

  return null;
}

// Extract working location from LinkedIn profile data
function extractWorkingLocation(profileData: any): string | null {
  // Try to get location from profile geo data
  if (profileData.geo?.full) {
    return profileData.geo.full;
  }
  
  if (profileData.geo?.city && profileData.geo?.country) {
    return `${profileData.geo.city}, ${profileData.geo.country}`;
  }
  
  if (profileData.geo?.city) {
    return profileData.geo.city;
  }
  
  if (profileData.geo?.country) {
    return profileData.geo.country;
  }
  
  // Try to get location from current work experience
  if (profileData.fullPositions && profileData.fullPositions.length > 0) {
    const currentPosition = profileData.fullPositions.find((pos: any) => 
      !pos.end || pos.end.year === 0 || pos.end.year === new Date().getFullYear()
    );
    
    if (currentPosition?.location) {
      return currentPosition.location;
    }
  }
  
  return null;
}

// Extract current company from LinkedIn profile data
function extractCurrentCompany(profileData: any): string | null {
  // Try to get from profile data first
  if (profileData.currentCompany) {
    return profileData.currentCompany;
  }
  
  // Try to get from current work experience
  if (profileData.fullPositions && profileData.fullPositions.length > 0) {
    const currentPosition = profileData.fullPositions.find((pos: any) => 
      !pos.end || pos.end.year === 0 || pos.end.year === new Date().getFullYear()
  );
    
    if (currentPosition?.companyName) {
      return currentPosition.companyName;
    }
  }
  
  return null;
}
