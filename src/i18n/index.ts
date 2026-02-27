import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en';
import hi from './locales/hi';
import ur from './locales/ur';
import bn from './locales/bn';
import ta from './locales/ta';

export const LANGUAGE_STORAGE_KEY = '@criccircle_language';

export const LANGUAGES = [
  { code: 'en', label: 'English',    nativeLabel: 'English'  },
  { code: 'hi', label: 'Hindi',      nativeLabel: 'हिंदी'    },
  { code: 'ur', label: 'Urdu',       nativeLabel: 'اردو'     },
  { code: 'bn', label: 'Bengali',    nativeLabel: 'বাংলা'    },
  { code: 'ta', label: 'Tamil',      nativeLabel: 'தமிழ்'   },
];

export const changeLanguage = async (langCode: string): Promise<void> => {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
  await i18n.changeLanguage(langCode);
};

export const initI18n = async (): Promise<void> => {
  const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        hi: { translation: hi },
        ur: { translation: ur },
        bn: { translation: bn },
        ta: { translation: ta },
      },
      lng: savedLang ?? 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
    });
};

export default i18n;
