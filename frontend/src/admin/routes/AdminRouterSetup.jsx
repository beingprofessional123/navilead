import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

import LoginPage from '../pages/Auth/LoginPage';
import ErrorPage from '../pages/Auth/ErrorPage';
import Dashboard from '../pages/Dashboard';
import UserManagementPage from '../pages/UserManagement/UserManagementPage';
import PlanManagementPage from '../pages/PlanManagement/PlanManagementPage';

const AdminRouterSetup = () => {
  return (
    <Routes>
      {/* ADMIN LOGIN ROUTES */}
      <Route path="/admin" element={<LoginPage />} />
      <Route path="/admin/login" element={<LoginPage />} />

      {/* PROTECTED ROUTES */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    
      <Route
        path="/admin/users-management"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <UserManagementPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/plan-management"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <PlanManagementPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 fallback */}
      <Route path="*" element={<ErrorPage code={404} message="Page Not Found" />} />
    </Routes>
  );
};

export default AdminRouterSetup;
