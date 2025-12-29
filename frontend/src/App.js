// src/App.js
import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import UserRouterSetup from './user/routes/UserRoutes';
import { ToastContainer } from 'react-toastify';
import { LimitProvider } from "./user/context/LimitContext";
import { AuthProvider } from './user/context/AuthContext';
import FloatingLanguageToggle from './user/components/common/FloatingLanguageToggle';

import { AdminAuthProvider } from './admin/context/AdminAuthContext';
import AdminFloatingLanguageToggle from './admin/components/FloatingLanguageToggle';
import AdminRouterSetup from './admin/routes/AdminRouterSetup';

function AppContent() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    if (isAdminRoute) {
        return (
            <AdminAuthProvider>
                <AdminRouterSetup />
                <AdminFloatingLanguageToggle />
                <ToastContainer position="top-center" autoClose={3000} />
            </AdminAuthProvider>
        );
    } else {
        return (
            <AuthProvider>
                <LimitProvider>
                    <UserRouterSetup />
                    <FloatingLanguageToggle />
                    <ToastContainer position="top-center" autoClose={3000} />
                </LimitProvider>
            </AuthProvider>
        );
    }
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
