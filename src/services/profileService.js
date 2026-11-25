import { sanitizeText, sanitizeImageUrl } from '../utils/security';

const PROFILE_KEY = 'warung_pribadi_profile';

const DEFAULT_PROFILE = {
  name: 'Warung Pribadi',
  subtitle: 'Kasir, Stok, Kasbon & Laporan',
  address: 'Jl. Sederhana No. 1, Indonesia',
  logo_url: ''
};

export const profileService = {
  getProfile() {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to parse shop profile:', e);
    }
    return DEFAULT_PROFILE;
  },

  updateProfile(profileData) {
    const newProfile = {
      name: sanitizeText(profileData.name) || DEFAULT_PROFILE.name,
      subtitle: sanitizeText(profileData.subtitle) || DEFAULT_PROFILE.subtitle,
      address: sanitizeText(profileData.address) || DEFAULT_PROFILE.address,
      logo_url: sanitizeImageUrl(profileData.logo_url)
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    return newProfile;
  }
};
