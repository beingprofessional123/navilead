import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { AdminAuthContext } from "../context/AdminAuthContext";
import api from "../../utils/api";

const FloatingLanguageToggle = () => {
  const { i18n } = useTranslation();
  const { user, authToken, login } = useContext(AdminAuthContext);
  const location = useLocation();

  const isDanish = i18n.language === "da";
  const isSettingsPage = location.pathname === "/admin/settings";
  const isLoggedOut = !user || !authToken;

  // ✅ Show only on settings page OR when logged out
  if (!isSettingsPage && !isLoggedOut) {
    return null;
  }

  const setLanguage = async (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("Admini18nextLng", lang);

    if (user && authToken) {
      try {
        const res = await api.put(
          "/admin/settings/language",
          { language: lang },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (res.data.success) {
          const updatedUser = { ...user, language: lang };
          localStorage.setItem("AdminUser", JSON.stringify(updatedUser));
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
