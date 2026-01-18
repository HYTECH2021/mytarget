import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import itTranslations from './locales/it.json';
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';
import esTranslations from './locales/es.json';

i18n
  .use(LanguageDetector) // Auto-rileva lingua browser
  .use(initReactI18next) // Passa i18n a react-i18next
  .init({
    resources: {
      it: {
        translation: itTranslations,
      },
      en: {
        translation: enTranslations,
      },
      fr: {
        translation: frTranslations,
      },
      es: {
        translation: esTranslations,
      },
    },
    fallbackLng: 'it', // Lingua di default
    debug: false,
    interpolation: {
      escapeValue: false, // React già escapea i valori
    },
    detection: {
      order: ['localStorage', 'navigator'], // Controlla localStorage prima, poi browser
      caches: ['localStorage'], // Salva la scelta in localStorage
    },
  });

export default i18n;
