// Shared types for LinkedIn sync microservice
export interface Skill {
  id: string;
  name: string;
  source: "esco" | "user" | "admin";
  is_active: boolean;
  esco_id?: string;
  abbreviations?: string[];
  created_at: Date;
  updated_at: Date;
  embedding?: any; // vector type
}

export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  linkedin_url: string;
  profile_image_url: string;
  working_location: string;
  bio: string;
  general_job_title: string;
  current_company: string;
  category: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// LinkedIn data interfaces
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
  profilePictures?: Array<{
    url?: string;
    width?: number;
    height?: number;
  }>;
  backgroundImage?: Array<{
    width?: number;
    height?: number;
    url?: string;
  }>;
  summary?: string;
  bio?: string;
  headline?: string;
  currentCompany?: string;
  geo?: {
    country?: string;
    city?: string;
    full?: string;
    countryCode?: string;
  };
  // Note: LinkedIn data uses 'fullPositions' for the actual position data
  // 'position' field appears to be a different field (possibly a count or ID)
  position?: any; // This field is not the positions array we need
  fullPositions?: Array<{
    companyId?: number;
    companyName?: string;
    companyUsername?: string;
    companyURL?: string;
    companyLogo?: string;
    companyIndustry?: string;
    companyStaffCountRange?: string;
    title?: string;
    multiLocaleTitle?: Record<string, string>;
    multiLocaleCompanyName?: Record<string, string>;
    location?: string;
    locationType?: string;
    description?: string;
    employmentType?: string;
    start?: { year?: number; month?: number; day?: number };
    end?: { year?: number; month?: number; day?: number };
  }>;
  skills?: Array<{
    name?: string;
    passedSkillAssessment?: boolean;
    endorsementsCount?: number;
  }>;
  languages?: Array<{
    name?: string;
    proficiency?: string;
  }>;
  educations?: Array<{
    schoolName?: string;
    degree?: string;
    fieldOfStudy?: string;
    grade?: string;
    description?: string;
    activities?: string;
    url?: string;
    schoolId?: string;
    logo?: Array<{
      url?: string;
      width?: number;
      height?: number;
    }>;
    start?: { year?: number; month?: number; day?: number };
    end?: { year?: number; month?: number; day?: number };
  }>;
  certifications?: Array<{
    name?: string;
    start?: { year?: number; month?: number; day?: number };
    end?: { year?: number; month?: number; day?: number };
    authority?: string;
    company?: {
      name?: string;
      universalName?: string;
      logo?: string;
      staffCountRange?: Record<string, any>;
      headquarter?: Record<string, any>;
    };
    timePeriod?: {
      start?: { year?: number; month?: number; day?: number };
      end?: { year?: number; month?: number; day?: number };
    };
  }>;
  projects?: Record<string, any>;
  supportedLocales?: Array<{
    country?: string;
    language?: string;
  }>;
  multiLocaleFirstName?: Record<string, string>;
  multiLocaleLastName?: Record<string, string>;
  multiLocaleHeadline?: Record<string, string>;
}

// Mapped data interfaces
export interface MappedSkill {
  skillId: string | null;
  skillName: string;
  isCore: boolean;
  endorsementsCount: number;
  source: "user";
  needsCreation: boolean;
}

export interface MappedEducation {
  degreeTitle: string;
  startYear: number;
  endYear: number; // Can be 0 if LinkedIn doesn't provide it
  institution: string;
  location: string | null;
}

export interface MappedVerification {
  jobTitle: string;
  companyName: string;
  startYear: number;
  endYear: number; // Can be 0 if LinkedIn doesn't provide it
  description: string[];
  order: number;
}

export interface MappedWorkExperience {
  jobTitle: string;
  companyName: string;
  startYear: number;
  endYear: number; // Can be 0 if LinkedIn doesn't provide it
  description: string[];
  order: number;
  location?: string;
  employmentType?: string;
}

export interface MappedLanguage {
  language: string;
  proficiency: string;
}

export interface MappedCertification {
  title: string;
  startYear: number; // Can be 0 if LinkedIn doesn't provide it
  endYear: number | null;
}

export interface MappedAvailability {
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
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
}

export interface MappedCandidateProfile {
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
  education: MappedEducation[];
  skills: MappedSkill[];
  workExperience: MappedWorkExperience[];
  verification: MappedVerification[];
  availability: MappedAvailability;
  languages: MappedLanguage[];
  certifications: MappedCertification[];
}

// Database operation results
export interface DatabaseOperationResult {
  success: boolean;
  insertedCount: number;
  error?: string;
}

export interface SkillsProcessingResult {
  totalSkills: number;
  createdSkills: number;
  alreadyExisted: number;
  linkedSkills: number;
}

export interface LinkedInSyncResult {
  success: boolean;
  results: {
    skillsProcessed: SkillsProcessingResult;
    educationInserted: number;
    languagesInserted: number;
    certificationsInserted: number;
    verificationInserted: number;
    profileUpdated: boolean;
  };
  error?: string;
}
