import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// ---------- Frontend translations ----------
import translationEN from "../locales/en/translation.json";
import apiEN from "../locales/en/Apitranslation.json";
import translationDA from "../locales/da/translation.json";
import apiDA from "../locales/da/Apitranslation.json";


// ✅ Merge all translations (frontend + admin)
const resources = {
  en: {
    translation: {
      ...translationEN,
      ...apiEN,
    }
  },
  da: {
    translation: {
      ...translationDA,
      ...apiDA,
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "da", // default to Danish
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"]
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
