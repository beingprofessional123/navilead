import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error(t('resetPassword.fillAll', { defaultValue: 'Please fill all fields.' }));
      return;
    }

    if (password.length < 6) {
      toast.error(t('resetPassword.passwordLength', { defaultValue: 'Password must be at least 6 characters long.' }));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('resetPassword.passwordMismatch', { defaultValue: 'Passwords do not match.' }));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/public/reset-password', { email, newPassword: password });
      toast.success(t('resetPassword.success', { defaultValue: 'Password reset successfully!' }));
      navigate('/login');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error resetting password. Please try again.';
      toast.error(t(`resetPassword.${errorMessage}`, { defaultValue: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginmain">
      <div className="logo">
        <Link to="/">
          <img src="/assets/images/logo.svg" className="img-fluid" alt="Logo" />
        </Link>
      </div>

      <div className="carddesign">
        <h1>{t('resetPassword.title', { defaultValue: 'Reset Password' })}</h1>
        <p className="text-center mb-3">
          {t('resetPassword.subtitle', { defaultValue: 'Set a new password for your account' })} <b>{email}</b>
        </p>

        <div className="formdesign">
          <form onSubmit={handleResetPassword}>
            <div className="row">
              <div className="col-md-12">
                <div className="form-group">
                  <label className="form-label">
                    {t('resetPassword.passwordLabel', { defaultValue: 'New Password' })}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder={t('resetPassword.passwordPlaceholder', { defaultValue: 'Enter new password' })}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="col-md-12">
                <div className="form-group">
                  <label className="form-label">
                    {t('resetPassword.confirmPasswordLabel', { defaultValue: 'Confirm Password' })}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                   placeholder={t('resetPassword.confirmPasswordPlaceholder', { defaultValue: 'Re-enter new password' })}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  />
                </div>
              </div>
            </div>
            <div className="login-btn">
              <button type="submit" className="btn btn-send w-100" disabled={loading}>
                {loading
                  ? t('resetPassword.loading', { defaultValue: 'Resetting...' })
                  : t('resetPassword.submit', { defaultValue: 'Reset Password' })}
              </button>
            </div>
          </form>

          <h5 className="text-center mt-3">
            {t('resetPassword.rememberPassword', { defaultValue: 'Remember your password?' })}{' '}
            <Link to="/login">
              {t('resetPassword.signIn', { defaultValue: 'Sign In' })}
            </Link>
          </h5>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
