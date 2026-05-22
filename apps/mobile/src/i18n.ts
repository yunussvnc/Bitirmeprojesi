import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import tr from './locales/tr.json';
import en from './locales/en.json';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string | readonly string[] | undefined) => void) => {
    try {
      // Web için localStorage kullan, native için AsyncStorage
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedData = window.localStorage.getItem('asemos-settings');
          if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed?.state?.language) {
              callback(parsed.state.language);
              return;
            }
          }
        }
      } else {
        const storedData = await AsyncStorage.getItem('asemos-settings');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          if (parsed?.state?.language) {
            callback(parsed.state.language);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Error reading language from storage', e);
    }
    
    // Fallback to system locale
    const systemCode = getLocales()[0]?.languageCode;
    const initialLang = systemCode === 'tr' ? 'tr' : 'en';
    callback(initialLang);
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
