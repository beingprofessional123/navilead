// src/routes/ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { isTokenExpired } from '../utils/auth'; // Keep this if you still want to check token expiration

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, authToken, loading, logout } = useContext(AdminAuthContext);

    if (loading) {
        return <div>Loading authentication...</div>; // Or your loader component
    }

    // If no token or token expired, log out and redirect to login
    if (!authToken || isTokenExpired(authToken)) {
        if (isAuthenticated) {
            logout(); // Clears localStorage and state, then navigates to /admin/Login
        }
        return <Navigate to="/admin/login" replace />;
    }

    // Authenticated, render children
    return children;
};

export default ProtectedRoute;
