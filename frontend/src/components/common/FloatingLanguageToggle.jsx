import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const FloatingLanguageToggle = () => {
  const { i18n } = useTranslation();
  const isDanish = i18n.language === "da";

  const setLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang); // ✅ store manually
    toast.success(
      lang === "da" ? "Sprog ændret til Dansk 🇩🇰" : "Language changed to English 🇬🇧"
    );
  };

  return (
    <div
      className="position-fixed"
      style={{ bottom: "20px", right: "20px", zIndex: 1050 }}
    >
      <div className="btn-group">
        <button
          className={`btn ${!isDanish ? "btn btn-send" : "btn btn-add"}`}

          onClick={() => setLanguage("en")}
        >
          EN
        </button>
        <button
          className={`btn ${isDanish ? "btn btn-send" : "btn btn-add"}`}
          onClick={() => setLanguage("da")}
        >
          DA
        </button>
      </div>
    </div>
  );
};

export default FloatingLanguageToggle;
