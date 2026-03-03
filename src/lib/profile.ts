const PROFILE_KEY = "sololeveling_profile";

export interface UserProfile {
  name: string;
  categories: string[];
  calorie_target?: number;
  protein_target?: number;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  categories: [],
  calorie_target: undefined,
  protein_target: undefined,
};

export function getProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<UserProfile>) } : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
