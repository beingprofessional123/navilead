import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from "react-i18next";
// ✅ Legacy-safe import
import parsePhoneNumberFromString from 'libphonenumber-js/min';

const SignupPage = () => {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullName = `${firstName} ${lastName}`.trim();

      // ✅ Parse and validate phone number
      const phoneNumber = parsePhoneNumberFromString(phone);

      if (!phoneNumber || !phoneNumber.isValid()) {
        toast.error(t('register.invalidPhone') || 'Please enter a valid phone number.');
        setLoading(false);
        return;
      }

      // ✅ Allow regions: USD, EUR, DKK, and India 🇮🇳
      const allowedRegions = [
        'US', // United States (USD)
        'DK', // Denmark (DKK)
        'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'FI', 'IE', 'PT', // Europe (EUR)
        'IN'  // India (INR)
      ];

      if (!allowedRegions.includes(phoneNumber.country)) {
        toast.error(t('register.unsupportedRegion') || 'Phone numbers from this region are not supported.');
        setLoading(false);
        return;
      }

      const formattedPhone = phoneNumber.formatInternational();

      // ✅ Proceed with signup
      const res = await api.post('/auth/register', {
        name: fullName,
        email,
        phone: formattedPhone,
        password,
      });

      // Auto login after signup
      login(res.data.token, res.data.user, res.data.userPlan);
      toast.success(t('api.register.success') || 'Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      const errorMessageKey = err.response?.data?.message || 'api.register.serverError';
      toast.error(t(errorMessageKey) || 'Server error, please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="loginmain">
      <div className="logo">
        <Link to="#"><img src="assets/images/logo.svg" className="img-fluid" alt="Logo" /></Link>
      </div>

      <div className="carddesign">
        <h1>{t('register.title')}</h1>
        <div className="formdesign">
          <form onSubmit={handleSignup}>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">{t('register.firstnameLabel')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('register.firstnamePlaceholder')}
                    value={firstName}
                    onChange={(e) => {
                      const value = e.target.value;
                      // ✅ Only letters allowed, no spaces or special chars
                      if (/^[A-Za-z]*$/.test(value)) {
                        setFirstName(value);
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">{t('register.lastnameLabel')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('register.lastnamePlaceholder')}
                    value={lastName}
                    onChange={(e) => {
                      const value = e.target.value;
                      // ✅ Only letters allowed, no spaces or special chars
                      if (/^[A-Za-z]*$/.test(value)) {
                        setLastName(value);
                      }
                    }}
                    required
                  />
                </div>
              </div>
            </div>


            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">{t('register.emailLabel')}</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder={t('register.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">{t('register.phoneLabel')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('register.phonePlaceholder')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('register.passwordLabel')}</label>
              <div className="password-input" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder={t('register.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <span
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '10px',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    fontSize: '1.1rem'
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="login-btn">
              <button type="submit" className="btn btn-send" disabled={loading}>
                {loading ? t('register.loading') : t('register.submit')}
              </button>
            </div>
          </form>

          <h5>
            {t('register.haveAccount')} <Link to="/login">{t('register.signIn')}</Link>
          </h5>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;