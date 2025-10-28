// src/admin/context/AdminAuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullPageLoader from '../components/FullPageLoader';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Load authentication data from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('AdminAuthToken');
        const storedUser = localStorage.getItem('AdminUser');

        if (storedToken && storedUser) {
            setAuthToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    // Login: store token & user
    const login = (token, userData, planData) => {
        localStorage.setItem('AdminAuthToken', token);
        localStorage.setItem('AdminUser', JSON.stringify(userData));

        setAuthToken(token);
        setUser(userData);
    };

    // Logout: clear state and localStorage
    const logout = () => {
        localStorage.removeItem('AdminAuthToken');
        localStorage.removeItem('AdminUser');

        setAuthToken(null);
        setUser(null);
        navigate('/admin/login', { state: { message: 'You have been logged out successfully.' } });
    };

    const contextValue = {
        authToken,
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!authToken,
    };

    if (loading) return <FullPageLoader />;

    return (
        <AdminAuthContext.Provider value={contextValue}>
            {children}
        </AdminAuthContext.Provider>
    );
};
