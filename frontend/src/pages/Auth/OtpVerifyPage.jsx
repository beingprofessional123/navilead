import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from "axios";
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';

const OtpVerifyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';
  const type = queryParams.get('type') || 'emailverification';
  const pagesprocess = queryParams.get('pagesprocess') || 'registration';

  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60); // 60s resend timer
  const inputRefs = useRef([]);

  const { login, isAuthenticated } = useContext(AuthContext);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // ✅ Countdown for resend OTP
  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [timer]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = value ? value[value.length - 1] : '';
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // ✅ Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    console.log("Base URL:", process.env.REACT_APP_API_BASE_URL);

    if (otpCode.length !== 4) {
      toast.error(
        t('otpVerify.invalidOtp', {
          defaultValue: 'Please enter a valid 4-digit OTP.',
        })
      );
      return;
    }

    setLoading(true);
    try {

       const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/auth/public/verify-otp`,
        {
          email,
          otp: otpCode,
          type,    // 'passwordreset' | 'emailverification'
          pagesprocess, // 'login' | 'register'
        }
      );

      const { token, user, userPlan, pagesprocess: processType } = res.data;


      // ✅ CASE 1: Email verification (from register)
      if (type === 'emailverification' && processType === 'registration') {
          if (!userPlan) {
            toast.info(
              t('otpVerify.selectPlan', {
                defaultValue: 'Your account is verified! Please select a plan to continue.',
              })
            );
            login(token, user, null);
            navigate('/plans');
            return;
          }

        toast.success(
          t('otpVerify.success', {
            defaultValue:
              'Your account verified successfully! You are now logged in.',
          })
        );
        login(token, user, userPlan);
        navigate('/dashboard');
        return;
      }

      // ✅ CASE 2: Email verification (from login)
      if (type === 'emailverification' && processType === 'login') {
        if (!userPlan) {
          toast.info(
            t('otpVerify.selectPlan', {
              defaultValue: 'Your email is verified! Please choose a plan to continue.',
            })
          );
          login(token, user, null);
          navigate('/plans');
          return;
        }
        toast.success(
          t('otpVerify.verifiedLoginFlow', {
            defaultValue:
              'Your email has been verified successfully. You can now log in.',
          })
        );
        navigate('/login');
        return;
      }

      // ✅ CASE 3: Password reset
      if (type === 'passwordreset') {
        toast.success(
          t('otpVerify.passwordReset', {
            defaultValue: 'OTP verified! You can now reset your password.',
          })
        );
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        return;
      }

      // ✅ Default fallback
      toast.success(
        t('otpVerify.default', {
          defaultValue: 'OTP verified successfully.',
        })
      );
      navigate('/');

    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Invalid OTP, please try again.';
      toast.error(
        t(`otpVerify.${errorMessage}`, { defaultValue: errorMessage })
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resend OTP
  const handleResendOtp = async () => {
    console.log("Base URL:", process.env.REACT_APP_API_BASE_URL);
    setResending(true);
       await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/auth/public/otp-send`,
        {
          email,
          type,
          pagesprocess,
        }
      );
      toast.success(
        t('otpVerify.resent', {
          defaultValue: 'OTP has been resent successfully!',
        })
      );
      setTimer(60); // restart countdown
  };


  return (
    <div className="loginmain">
      <div className="logo">
        <Link to="/">
          <img src="/assets/images/logo.svg" className="img-fluid" alt="Logo" />
        </Link>
      </div>

      <div className="carddesign">
        <h1>{t('otpVerify.title', { defaultValue: 'Verify OTP' })}</h1>
        <p className="text-center mb-3">
          {t('otpVerify.subtitle', { defaultValue: 'Enter the 4-digit code sent to your email' })} <b>{email}</b>
        </p>

        <div className="formdesign">
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group d-flex justify-content-center gap-3 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  className="form-control text-center fs-4 fw-bold"
                  style={{
                    width: '60px',
                    height: '60px',
                    maxWidth: '70px',
                    border: '2px solid #ccc',
                    borderRadius: '10px',
                  }}
                  maxLength="1"
                  value={digit}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              ))}
            </div>

            <div className="login-btn">
              <button type="submit" className="btn btn-send w-100" disabled={loading}>
                {loading
                  ? t('otpVerify.loading', { defaultValue: 'Verifying...' })
                  : t('otpVerify.submit', { defaultValue: 'Verify OTP' })}
              </button>
            </div>
          </form>

          <div className="text-center mt-3">
            {timer > 0 ? (
              <p>
                {t('otpVerify.resendIn', { defaultValue: 'Resend OTP in' })} <b>{timer}s</b>
              </p>
            ) : (
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={handleResendOtp}
                disabled={resending}
              >
                {resending
                  ? t('otpVerify.resending', { defaultValue: 'Resending...' })
                  : t('otpVerify.resend', { defaultValue: 'Resend OTP' })}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerifyPage;
