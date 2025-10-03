// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullPageLoader from '../components/common/FullPageLoader';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(null);
    const [user, setUser] = useState(null);
    const [userPlan, setUserPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Load authentication data from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');
         const storedPlan = localStorage.getItem('userPlan');

        if (storedToken && storedUser) {
            setAuthToken(storedToken);
            setUser(JSON.parse(storedUser));
            if (storedPlan) setUserPlan(JSON.parse(storedPlan));
        }
        setLoading(false);
    }, []);

    // Login: store token, user, and plan
    const login = (token, userData, planData) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        if (planData) localStorage.setItem('userPlan', JSON.stringify(planData));

        setAuthToken(token);
        setUser(userData);
        if (planData) setUserPlan(planData);
    };

    // Logout: clear state and localStorage
    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userPlan');

        setAuthToken(null);
        setUser(null);
        setUserPlan(null);

        navigate('/login', { state: { message: 'You have been logged out successfully.' } });
    };

    // Context value
    const contextValue = {
        authToken,
        user,
        userPlan,
        loading,
        login,
        logout,
        isAuthenticated: !!authToken, // true if token exists
    };

    // Show loader while checking auth
    if (loading) {
        return <FullPageLoader />;
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
