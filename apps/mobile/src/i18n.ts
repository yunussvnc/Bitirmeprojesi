import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import tr from './locales/tr.json';
import en from './locales/en.json';
import { getSystemAppLanguage } from './utils/locale';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string | readonly string[] | undefined) => void) => {
    callback(getSystemAppLanguage());
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      tr: { translation: tr },
      de: { translation: en },
      fr: { translation: en },
      es: { translation: en },
      ar: { translation: en },
      ru: { translation: en },
    },
    interpolation: {
      escapeValue: false, 
    },
    react: {
      useSuspense: false, 
    }
  });

export default i18n;
