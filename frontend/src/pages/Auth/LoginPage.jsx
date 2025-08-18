import React, { useState, useContext, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';

const LoginPage = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/auth/login`, {
        email: loginEmail,
        password: loginPassword,
      });

      const { token, user } = res.data;

      login(token, user);
      toast.success('Login successful!');
      navigate('/dashboard'); // Redirect after login
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="loginmain">
      <div className="logo">
        <a href="#"><img src="assets/images/logo.svg" className="img-fluid" alt="Logo" /></a>
      </div>

      <div className="carddesign">
        <h1>Log in to your account</h1>
        <div className="formdesign">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Email Address"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <span
                  className="toggle-password"
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '10px',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#555',
                    fontSize: '1.1rem'
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="form-group forgotpassword">
              <Link to="/forgot-password">Forgot Password ?</Link>
            </div>

            <div className="login-btn">
              <button type="submit" className="btn btn-send" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </div>
          </form>

          <h5>
            Don't have an account? <Link to="/register">Sign Up</Link>
          </h5>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
