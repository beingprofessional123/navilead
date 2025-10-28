import React, { useState, useContext, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AdminAuthContext } from "../../context/AdminAuthContext";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, login } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/auth/admin/login`,
        {
          email: loginEmail,
          password: loginPassword,
        }
      );

      const { token, user, message } = res.data;

      login(token, user);
      toast.success(t(message) || t("api.login.success"));
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || "api.login.failed";
      toast.error(t(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginmain">
      <div className="logo">
        <Link href="#">
          <img
            src="/assets/images/logo.svg"
            className="img-fluid"
            alt="Logo"
          />
        </Link>
      </div>

      <div className="carddesign">
        <h1>{t("login.title")}</h1>
        <div className="formdesign">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">{t("login.emailLabel")}</label>
              <input
                type="email"
                className="form-control"
                placeholder={t("login.emailPlaceholder")}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("login.passwordLabel")}</label>
              <div className="password-input" style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder={t("login.passwordPlaceholder")}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{ paddingRight: "40px" }}
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "10px",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            <div className="login-btn">
              <button type="submit" className="btn btn-send" disabled={loading}>
                {loading ? t("login.button.loggingIn") : t("login.button.submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
