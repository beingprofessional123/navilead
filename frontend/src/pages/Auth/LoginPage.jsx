import React, { useState, useContext, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/auth/public/login`,
        {
          email: loginEmail,
          password: loginPassword,
        }
      );

      const { token, user, userPlan, message, otpSent, type } = res.data;

      // ✅ If email is not verified — redirect to OTP verification page
      if (otpSent && type === "emailverification") {
        toast.info(t(message) || "Please verify your email first.");
        navigate(
          `/otp-page?email=${encodeURIComponent(loginEmail)}&type=${type}&pagesprocess=login`
        );
        return;
      }


      login(token, user, userPlan);
      toast.success(t(message) || t("api.login.success"));
      navigate("/dashboard");
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
            src="assets/images/logo.svg"
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

            <div className="form-group forgotpassword">
              <Link to="/">{t("login.forgotPassword")}</Link>
            </div>
            <div className="login-btn">
              <button type="submit" className="btn btn-send" disabled={loading}>
                {loading ? t("login.button.loggingIn") : t("login.button.submit")}
              </button>
            </div>
          </form>

          <h5>
            {t("login.noAccount")} <Link to="/register">{t("login.signup")}</Link>
          </h5>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
