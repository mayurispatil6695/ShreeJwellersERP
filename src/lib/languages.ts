export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

export interface Region {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  flag: string;
}

export const SUPPORTED_REGIONS: Region[] = [
  { code: 'IN', name: 'India', currency: 'INR', currencySymbol: '₹', flag: '🇮🇳' },
  { code: 'US', name: 'United States', currency: 'USD', currencySymbol: '$', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencySymbol: '£', flag: '🇬🇧' },
  { code: 'AE', name: 'UAE', currency: 'AED', currencySymbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', currencySymbol: 'S$', flag: '🇸🇬' },
  { code: 'AU', name: 'Australia', currency: 'AUD', currencySymbol: 'A$', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', currency: 'CAD', currencySymbol: 'C$', flag: '🇨🇦' },
];

export interface Timezone {
  value: string;
  label: string;
  offset: string;
}

export const SUPPORTED_TIMEZONES: Timezone[] = [
  { value: 'Asia/Kolkata', label: 'India Standard Time', offset: 'UTC+5:30' },
  { value: 'America/New_York', label: 'Eastern Time', offset: 'UTC-5:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time', offset: 'UTC-8:00' },
  { value: 'Europe/London', label: 'Greenwich Mean Time', offset: 'UTC+0:00' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time', offset: 'UTC+4:00' },
  { value: 'Asia/Singapore', label: 'Singapore Time', offset: 'UTC+8:00' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time', offset: 'UTC+11:00' },
  { value: 'America/Toronto', label: 'Eastern Time (Canada)', offset: 'UTC-5:00' },
];

// Translation strings (simplified for demo)
export const translations: Record<string, Record<string, string>> = {
  en: {
    'settings.title': 'Settings',
    'settings.description': 'Configure your store, preferences, and system settings',
    'language.title': 'Language & Region',
    'language.description': 'Set your preferred language, region, and timezone',
    'backup.title': 'Backup & Export',
    'backup.description': 'Manage data backups and exports',
    'billing.title': 'Billing & Plans',
    'billing.description': 'Manage your subscription and billing',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',
  },
  hi: {
    'settings.title': 'सेटिंग्स',
    'settings.description': 'अपनी दुकान, प्राथमिकताएं और सिस्टम सेटिंग्स कॉन्फ़िगर करें',
    'language.title': 'भाषा और क्षेत्र',
    'language.description': 'अपनी पसंदीदा भाषा, क्षेत्र और समय क्षेत्र सेट करें',
    'backup.title': 'बैकअप और निर्यात',
    'backup.description': 'डेटा बैकअप और निर्यात प्रबंधित करें',
    'billing.title': 'बिलिंग और योजनाएं',
    'billing.description': 'अपनी सदस्यता और बिलिंग प्रबंधित करें',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.loading': 'लोड हो रहा है...',
    'common.success': 'सफलता',
    'common.error': 'त्रुटि',
  },
  ta: {
    'settings.title': 'அமைப்புகள்',
    'settings.description': 'உங்கள் கடை, விருப்பங்கள் மற்றும் கணினி அமைப்புகளை உள்ளமைக்கவும்',
    'language.title': 'மொழி & பிராந்தியம்',
    'language.description': 'உங்கள் விருப்பமான மொழி, பிராந்தியம் மற்றும் நேர மண்டலத்தை அமைக்கவும்',
    'backup.title': 'காப்புப்பிரதி & ஏற்றுமதி',
    'backup.description': 'தரவு காப்புப்பிரதிகள் மற்றும் ஏற்றுமதிகளை நிர்வகிக்கவும்',
    'billing.title': 'பில்லிங் & திட்டங்கள்',
    'billing.description': 'உங்கள் சந்தா மற்றும் பில்லிங்கை நிர்வகிக்கவும்',
    'common.save': 'சேமி',
    'common.cancel': 'ரத்துசெய்',
    'common.loading': 'ஏற்றுகிறது...',
    'common.success': 'வெற்றி',
    'common.error': 'பிழை',
  },
};

export function t(key: string, lang: string = 'en'): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}
