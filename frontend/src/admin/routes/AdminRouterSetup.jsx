import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

import LoginPage from '../pages/Auth/LoginPage';
import ErrorPage from '../pages/Auth/ErrorPage';
import Dashboard from '../pages/Dashboard';
import UserManagementPage from '../pages/UserManagement/UserManagementPage';
import PlanManagementPage from '../pages/PlanManagement/PlanManagementPage';
import CreditPlanManagementPage from '../pages/CreditPlanManagement/CreditPlanManagementPage';
import TransactionManagementPage from '../pages/TransactionManagement/TransactionManagementPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import TicketPage from '../pages/Tickets/TicketPage';

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
      <Route
        path="/admin/credit-plan-management"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <CreditPlanManagementPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transaction-management"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <TransactionManagementPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

        <Route
        path="/admin/tickets"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <TicketPage /> {/* Placeholder, replace with actual TicketPage if available */}
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <SettingsPage />
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
