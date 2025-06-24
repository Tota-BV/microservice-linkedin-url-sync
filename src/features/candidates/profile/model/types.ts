export type ExperienceType = {
  id: number | string;
  company: string;
  jobTitle: string;
  decription: string;
  dates: {
    from: string;
    to: string;
  };
  skills: Record<"value", string>[];
};

export type EducationType = {
  id: number | string;
  degree: string;
  institution: string;
  dates: {
    from: string;
    to: string;
  };
};

type TimeRange = {
  from: string;
  to: string;
};

export type AvailabilityType = {
  monday: TimeRange;
  tuesday: TimeRange;
  wednesday: TimeRange;
  thursday: TimeRange;
  friday: TimeRange;
  saturday?: TimeRange;
  sunday?: TimeRange;
};
