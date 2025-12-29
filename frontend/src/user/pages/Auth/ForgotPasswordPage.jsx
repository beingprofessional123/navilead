import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from "axios";
import { useTranslation } from "react-i18next";

const ForgotPasswordPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error(t('forgotPassword.emailRequired', { defaultValue: 'Please enter your email.' }));
            return;
        }

        setLoading(true);
        try {
           const res = await axios.post(
            `${process.env.REACT_APP_API_BASE_URL}/auth/public/otp-send`,
            {
                email,
                type: 'passwordreset', // 👈 use this when user is resetting password
            }
            );
            toast.success(t('forgotPassword.otpSent', { defaultValue: 'Your OTP has been sent successfully!' }));

            // ✅ Correct query param
             navigate(
            `/otp-page?email=${encodeURIComponent(res.data.email || email)}&type=passwordreset`
            );
        } catch (err) {
            const errorMessage =
                err.response?.data?.message || 'Server error, please try again.';
            toast.error(t(`forgotPassword.${errorMessage}`, { defaultValue: errorMessage }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="loginmain">
            <div className="logo">
                <Link to="/">
                    <img
                        src="/assets/images/logo.svg"
                        className="img-fluid"
                        alt="Logo"
                    />
                </Link>
            </div>

            <div className="carddesign">
                <h1>{t('forgotPassword.title', { defaultValue: 'Forgot Password' })}</h1>

                <div className="formdesign">
                    <form onSubmit={handleForgotPassword}>
                        <div className="row">
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label className="form-label">
                                        {t('forgotPassword.emailLabel', { defaultValue: 'Email Address' })}
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder={t('forgotPassword.emailPlaceholder', { defaultValue: 'Enter your email' })}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="login-btn">
                            <button type="submit" className="btn btn-send" disabled={loading}>
                                {loading
                                    ? t('forgotPassword.loading', { defaultValue: 'Sending...' })
                                    : t('forgotPassword.submit', { defaultValue: 'Send OTP' })}
                            </button>
                        </div>
                    </form>

                    <h5>
                        {t('forgotPassword.rememberPassword', { defaultValue: 'Remember your password?' })}{' '}
                        <Link to="/login">
                            {t('forgotPassword.signIn', { defaultValue: 'Sign In' })}
                        </Link>
                    </h5>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
