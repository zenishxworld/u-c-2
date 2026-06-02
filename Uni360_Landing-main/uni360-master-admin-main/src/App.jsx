import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import UserManagement from "./pages/users/EnhancedUserManagement";
import UniversityManagement from "./pages/universities/UniversityManagement";
import ApplicationOversight from "./pages/applications/ApplicationOversight";
import ApplicationDetails from "./pages/applications/ApplicationDetails";
import StudentDetails from "./pages/students/StudentDetails";
import AdminDetails from "./pages/users/AdminDetails";
import ExternalAdminDetails from "./pages/users/ExternalAdminDetails";
import CommissionTracker from "./pages/commissions/CommissionTracker";
import PaymentManagement from "./pages/payments/PaymentManagement";
import ReportsAnalytics from "./pages/reports/ReportsAnalytics";
import DocumentManagement from "./pages/documents/DocumentManagement";
import QueryManagement from "./pages/queries/QueryManagement";
import AccountSettings from "./pages/settings/AccountSettings";
import AITools from "./pages/ai/AITools";
import AdminRequestManagement from "./pages/admin-requests/AdminRequestManagement";
import NotificationManagement from "./pages/notifications/NotificationManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import UserDetailsPage from './pages/admin/UserDetailsPage';
import Leads from "./pages/Leads/Leads";

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <Router>
          <div className="App">
            <Routes>
              {/* Root redirect to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Authentication Routes */}
              <Route
                path="/login"
                element={
                  <AuthLayout>
                    <Login />
                  </AuthLayout>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                <Route index element={<Dashboard />} />
                <Route path="users/:userId/details" element={<UserDetailsPage />} />
              </Route>

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                <Route path="users" element={<UserManagement />} />
                <Route path="users/:id" element={<StudentDetails />} />
                <Route path="users/student/:id" element={<StudentDetails />} />
                <Route path="users/admin/:id" element={<AdminDetails />} />
                <Route
                  path="users/external-admin/:id"
                  element={<ExternalAdminDetails />}
                />
                <Route path="universities" element={<UniversityManagement />} />
                <Route path="applications" element={<ApplicationOversight />} />
                <Route
                  path="applications/:id"
                  element={<ApplicationDetails />}
                />
                <Route path="commissions" element={<CommissionTracker />} />
                <Route path="payments" element={<PaymentManagement />} />
                <Route path="reports" element={<ReportsAnalytics />} />
                <Route path="documents" element={<DocumentManagement />} />
                <Route path="queries" element={<QueryManagement />} />
                <Route
                  path="admin-requests"
                  element={<AdminRequestManagement />}
                />
                <Route
                  path="notifications"
                  element={<NotificationManagement />}
                />
                <Route path="leads" element={<Leads />} />
                <Route path="settings" element={<AccountSettings />} />
                <Route path="ai-tools" element={<AITools />} />
              </Route>

              {/* Catch all route - redirect to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;