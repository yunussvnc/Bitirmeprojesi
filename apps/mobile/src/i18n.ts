import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { mmkv } from '@/src/utils/mmkvStorage';

import tr from './locales/tr.json';
import en from './locales/en.json';

const i18n = createInstance();

const languageDetector = {
  type: 'languageDetector' as const,
  async: false,
  detect: () => {
    try {
      const storedData = mmkv.getString('asemos-settings');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed?.state?.language) {
          return parsed.state.language;
        }
      }
    } catch (e) {
      console.warn('Error reading language from MMKV', e);
    }
    
    // Fallback to system locale
    const systemCode = getLocales()[0]?.languageCode;
    return systemCode === 'tr' ? 'tr' : 'en';
  },
  init: () => {},
  cacheUserLanguage: () => {}, // Managed by zustand persist store
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      tr: { translation: tr },
    },
    interpolation: {
      escapeValue: false, 
    },
    react: {
      useSuspense: false, 
    }
  });

export default i18n;
