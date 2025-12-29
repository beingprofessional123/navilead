import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import api from "../../../utils/api"; // ✅ axios instance with baseURL & headers

const FloatingLanguageToggle = () => {
  const { i18n } = useTranslation();
  const { user, authToken, login } = useContext(AuthContext);

  const isDanish = i18n.language === "da";

  const setLanguage = async (lang) => {
    // update i18n + localStorage always
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);

    // ✅ If user is logged in -> update in DB
    if (user && authToken) {
      try {
        const res = await api.put(
          "/settings/language",
          { language: lang },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (res.data.success) {
          // update user in localStorage + context
          const updatedUser = { ...user, language: lang };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          login(authToken, updatedUser);
        }
      } catch (error) {
        console.error("Language update failed:", error);
      }
    }

    // ✅ Show toast regardless
    // toast.success(
    //   lang === "da"
    //     ? "Sprog ændret til Dansk 🇩🇰"
    //     : "Language changed to English 🇬🇧"
    // );
  };

  return (
    <div
      className="position-fixed"
      style={{ bottom: "20px", right: "20px", zIndex: 2000 }}
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
