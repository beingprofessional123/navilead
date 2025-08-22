import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import frontend translations
import translationEN from "../locales/en/translation.json";
import apiEN from "../locales/en/Apitranslation.json";

// Import Danish translations
import translationDA from "../locales/da/translation.json";
import apiDA from "../locales/da/Apitranslation.json";

// ✅ Merge translations
const resources = {
  en: {
    translation: {
      ...translationEN,
      ...apiEN
    }
  },
  da: {
    translation: {
      ...translationDA,
      ...apiDA
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "da", // default Danish
    detection: {
      order: ["localStorage", "navigator"], // check localStorage first
      caches: ["localStorage"]              // save to localStorage
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
