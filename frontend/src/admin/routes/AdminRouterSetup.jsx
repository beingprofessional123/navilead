import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

import LoginPage from '../pages/Auth/LoginPage';
import ErrorPage from '../pages/Auth/ErrorPage';
import Dashboard from '../pages/Dashboard';

const RouterSetup = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* PROTECTED ROUTES */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    
      {/* 404 fallback */}
      <Route path="*" element={<ErrorPage code={404} message="Page Not Found" />} />
    </Routes>
  );
};

export default RouterSetup;
