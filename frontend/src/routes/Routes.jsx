import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import ProtectedRoute from './ProtectedRoute';

import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import OfferPage from '../pages/OfferPage';
import ErrorPage from '../pages/Error/ErrorPage';
import Dashboard from '../pages/Dashboard';
import EmailSMSPage from '../pages/emailTemplate/EmailSMSPage';
import PricingTemplatesPage from '../pages/pricingTempate/PricingTemplatesPage';
import OffersTemplatesPage from '../pages/offersTempate/OffersTemplatesPage';
import LeadsPage from '../pages/Leads/LeadsPage';
import LeadViewPage from '../pages/Leads/LeadViewPage'; 
import IntegrationsPage from '../pages/Integrations/IntegrationsPage'; 
import SettingsPage from '../pages/Settings/SettingsPage'; 
import WorkflowsPage from '../pages/Workflows/WorkflowsPage'; 
import CustomizeTemplatesPage from '../pages/offersTempate/CustomizeTemplatesPage'; 

const RouterSetup = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/offer/:id" element={<OfferPage />} />

      {/* PROTECTED ROUTES */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <Dashboard />
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <LeadsPage /> {/* Placeholder, replace with actual LeadsPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/:id"
        element={
          <ProtectedRoute>
              <LeadViewPage /> {/* This is the new route for viewing a single lead */}
          </ProtectedRoute>
        }
      />
      <Route
        path="/email-sms"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <EmailSMSPage /> {/* Placeholder, replace with actual EmailSMSPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflows"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <WorkflowsPage /> {/* Placeholder, replace with actual WorkflowsPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/integrations"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <IntegrationsPage /> {/* Placeholder, replace with actual IntegrationsPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pricing-templates"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <PricingTemplatesPage /> {/* Placeholder, replace with actual PricingTemplatesPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/templatesoffers"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <OffersTemplatesPage /> {/* Placeholder, replace with actual OfferTemplatesPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customize-templates"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <CustomizeTemplatesPage /> {/* Placeholder, replace with actual CustomizeTemplatesPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <Dashboard /> {/* Placeholder, replace with actual BillingPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <SettingsPage /> {/* Placeholder, replace with actual SettingsPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <Dashboard /> {/* Placeholder, replace with actual AdminPanelPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      {/* Routes for quick actions from Dashboard */}
      <Route
        path="/add-lead"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <Dashboard /> {/* Placeholder, replace with actual AddLeadPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/send-offer"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <Dashboard /> {/* Placeholder, replace with actual SendOfferPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-lead"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <Dashboard /> {/* Placeholder, replace with actual CreateLeadPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/send-email-campaign"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <Dashboard /> {/* Placeholder, replace with actual SendEmailCampaignPage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-offer-template"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <Dashboard /> {/* Placeholder, replace with actual CreateOfferTemplatePage if available */}
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 fallback */}
      <Route path="*" element={<ErrorPage code={404} message="Page Not Found" />} />
    </Routes>
  );
};

export default RouterSetup;
