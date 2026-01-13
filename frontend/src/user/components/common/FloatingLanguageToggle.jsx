import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../../utils/api";

const FloatingLanguageToggle = () => {
  const { i18n } = useTranslation();
  const { user, authToken, login } = useContext(AuthContext);
  const location = useLocation();

  const isDanish = i18n.language === "da";
  const isSettingsPage = location.pathname === "/settings";
  const isLoggedOut = !user || !authToken;

  // ✅ SHOW ONLY on settings page OR when logged out
  if (!isSettingsPage && !isLoggedOut) {
    return null;
  }

  const setLanguage = async (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);

    if (user && authToken) {
      try {
        const res = await api.put(
          "/settings/language",
          { language: lang },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (res.data.success) {
          const updatedUser = { ...user, language: lang };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          login(authToken, updatedUser);
        }
      } catch (err) {
        console.error("Language update failed:", err);
      }
    }
  };

  return (
    <div
      className="position-fixed"
      style={{ bottom: "20px", right: "20px", zIndex: 2000 }}
    >
      <div className="btn-group">
        <button
          className={`btn ${!isDanish ? "btn-send" : "btn-add"}`}
          onClick={() => setLanguage("en")}
        >
          EN
        </button>
        <button
          className={`btn ${isDanish ? "btn-send" : "btn-add"}`}
          onClick={() => setLanguage("da")}
        >
          DA
        </button>
      </div>
    </div>
  );
};

export default FloatingLanguageToggle;
