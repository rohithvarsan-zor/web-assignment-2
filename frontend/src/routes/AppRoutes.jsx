import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Protection
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Public Pages
import HomePage from '../pages/public/HomePage';
import JobsPage from '../pages/public/JobsPage';
import JobDetailPage from '../pages/public/JobDetailPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import AboutPage from '../pages/public/AboutPage';
import ContactPage from '../pages/public/ContactPage';
import NotFoundPage from '../pages/public/NotFoundPage';

// Candidate Pages
import CandidateDashboard from '../pages/candidate/CandidateDashboard';
import CandidateProfile from '../pages/candidate/CandidateProfile';
import CandidateApplications from '../pages/candidate/CandidateApplications';
import CandidateSavedJobs from '../pages/candidate/CandidateSavedJobs';
import CandidateInterviews from '../pages/candidate/CandidateInterviews';
import CandidateNotifications from '../pages/candidate/CandidateNotifications';

// Recruiter Pages
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import RecruiterJobs from '../pages/recruiter/RecruiterJobs';
import RecruiterCreateJob from '../pages/recruiter/RecruiterCreateJob';
import RecruiterEditJob from '../pages/recruiter/RecruiterEditJob';
import RecruiterApplications from '../pages/recruiter/RecruiterApplications';
import RecruiterInterviews from '../pages/recruiter/RecruiterInterviews';
import RecruiterProfile from '../pages/recruiter/RecruiterProfile';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminJobs from '../pages/admin/AdminJobs';
import AdminApplications from '../pages/admin/AdminApplications';
import AdminAuditLogs from '../pages/admin/AdminAuditLogs';
import AdminSettings from '../pages/admin/AdminSettings';

// Helper component for /dashboard redirect
function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />;
  return <Navigate to="/candidate/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Routes with PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 2. Authentication Pages (Standalone) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 3. Global Dashboard Shortcut */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />

      {/* 4. Candidate Protected Routes */}
      <Route
        path="/candidate"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['candidate']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/candidate/dashboard" replace />} />
        <Route path="dashboard" element={<CandidateDashboard />} />
        <Route path="profile" element={<CandidateProfile />} />
        <Route path="applications" element={<CandidateApplications />} />
        <Route path="saved-jobs" element={<CandidateSavedJobs />} />
        <Route path="interviews" element={<CandidateInterviews />} />
        <Route path="notifications" element={<CandidateNotifications />} />
      </Route>

      {/* 5. Recruiter Protected Routes */}
      <Route
        path="/recruiter"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['recruiter', 'admin']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
        <Route path="dashboard" element={<RecruiterDashboard />} />
        <Route path="jobs" element={<RecruiterJobs />} />
        <Route path="jobs/create" element={<RecruiterCreateJob />} />
        <Route path="jobs/:id/edit" element={<RecruiterEditJob />} />
        <Route path="applications" element={<RecruiterApplications />} />
        <Route path="interviews" element={<RecruiterInterviews />} />
        <Route path="profile" element={<RecruiterProfile />} />
      </Route>

      {/* 6. Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['admin']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="jobs" element={<AdminJobs />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
