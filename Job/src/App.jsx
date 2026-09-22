import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/jobs';
import ProfileSetup from './pages/ProfileSetup';
import StudentDashboard from './components/StudentDashboard';
import EnhancedAdminDashboard from './components/EnhancedAdminDashboard';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';
import HowItWorksPage from './pages/HowItWorksPage';
import CareerResourcesPage from './pages/CareerResourcesPage';
import DriveDetailsPage from './pages/DriveDetailsPage';
import StudentDocuments from './pages/StudentDocuments';
import StudentCalendar from './pages/StudentCalendar';
import AdminEvents from './pages/AdminEvents';
import AdminReports from './pages/AdminReports';
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/protectedRoute';
import RoleRoute from './components/RoleRoute';
import { useAuth } from './contexts/AuthContext';
import './App.css';

// Helper component to bind user to StudentDashboard from AuthContext
const StudentView = ({ tab = 'drives' }) => {
  const { user } = useAuth();
  return <StudentDashboard user={user} initialTab={tab} />;
};

// Helper component to bind user to EnhancedAdminDashboard from AuthContext
const AdminView = ({ tab = 'overview' }) => {
  const { user } = useAuth();
  return <EnhancedAdminDashboard user={user} initialTab={tab} />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/register" element={<Register />} />
          <Route path="/placement-drives" element={<Jobs />} />
          <Route path="/placement-drives/:driveId" element={<DriveDetailsPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:companyId" element={<CompanyDetailsPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/career-resources" element={<CareerResourcesPage />} />

          {/* Student Profile Setup (Allows Unverified Students) */}
          <Route path="/profile-setup" element={
            <ProtectedRoute allowUnverified={true}>
              <RoleRoute roles={['student']}>
                <ProfileSetup />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Student Routes */}
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/dashboard" element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <StudentView tab="drives" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/student/drives" element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <StudentView tab="drives" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/student/drives/:driveId" element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <DriveDetailsPage />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/student/profile" element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <StudentView tab="profile" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/student/applications" element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <StudentView tab="applications" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/student/applications/:applicationId" element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <StudentView tab="applications" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/student/documents" element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <StudentDocuments />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/student/calendar" element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <StudentCalendar />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/student/career-preparation" element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <CareerResourcesPage />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/student/analytics" element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <StudentView tab="analytics" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/student/notifications" element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <StudentView tab="notifications" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/student/settings" element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <SettingsPage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <AdminView tab="overview" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/students" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <AdminView tab="verification" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/companies" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <AdminView tab="jobs" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/drives" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <AdminView tab="jobs" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/applications" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <AdminView tab="pipeline" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/recruitment-events" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <AdminEvents />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <AdminView tab="analytics" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <AdminReports />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <AdminView tab="overview" />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <SettingsPage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Legacy / Compatibility Routes */}
          <Route path="/jobs" element={
            <ProtectedRoute>
              <Jobs />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowUnverified={true}>
              <ProfileSetup />
            </ProtectedRoute>
          } />

          {/* 404 Wildcard Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;