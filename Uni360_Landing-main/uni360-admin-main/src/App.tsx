// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { AuthInit } from "./components/AuthInit";
import RequireAuth from "./routes/RequireAuth";
import { MainLayout } from "./components/layout/MainLayout";

import { useAppSelector } from "./hooks/useRedux";
import { getAuthUser } from "./lib/onboarding";

// pages (adjust imports to your paths)
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { RegisterB2B } from "./pages/auth/RegisterB2B";
import { AdminLogin } from "./pages/auth/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Universities from "./pages/Universities";
import { Applications } from "./pages/Applications";
import { Documents } from "./pages/Documents";
import { Payments } from "./pages/Payments";
import Settings from "./pages/Settings";
import { Appointments } from "./pages/Appointments";
import { Students } from "./pages/Students";
import { StudentDetails } from "./pages/StudentDetails";
import ApplicationDetails from "./pages/ApplicationDetails";
import History from './pages/History';
import Resources from "./pages/Resources";

import { ToastDemo } from "./pages/ToastDemo";
import AITools from "./pages/AITools";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import NewApplication from "./pages/NewApplication";
import Communications from "./pages/Communications";
import { B2BOnboardingModal } from "./components/onboarding/B2BOnboardingModal";

const queryClient = new QueryClient();

// Public routes must wait for Redux hydration and use Redux (not localStorage)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading } = useAppSelector((s) => s.auth);
  if (loading) return null; // or a tiny spinner
  return <>{children}</>;
};

const WelcomeMessage: React.FC = () => {
  const authUser = getAuthUser();
  const firstName = authUser?.name?.split(" ")[0] || "Partner";
  return (
    <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
      <h1 className="text-2xl font-bold text-foreground mb-2">Welcome, {firstName}!</h1>
      <p className="text-muted-foreground mb-4">
        Your partnership application has been successfully submitted and assigned a dedicated review specialist. We appreciate your interest and will provide a comprehensive response within our standard review timeframe.
      </p>
    </div>
  );
};

const EnhancedDashboard: React.FC = () => (
  <>
    <WelcomeMessage />
    <Dashboard />
  </>
);

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthInit>
              <Routes>
                {/* Root redirects to login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Public */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicRoute>
                      <Signup />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register-b2b"
                  element={
                    <PublicRoute>
                      <RegisterB2B />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/b2b-onboarding"
                  element={
                    <PublicRoute>
                      <B2BOnboardingModal open={true} onClose={() => {}} />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/admin/login"
                  element={
                    <PublicRoute>
                      <AdminLogin />
                    </PublicRoute>
                  }
                />

                {/* Protected */}
                <Route element={<RequireAuth />}>
                  <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<EnhancedDashboard />} />
                    <Route path="/universities" element={<Universities />} />
                    <Route path="/applications" element={<Applications />} />
                    <Route path="/applications/new" element={<NewApplication />} />
                    <Route path="/applications/:id" element={<ApplicationDetails />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/resources" element={<Resources />} />

                    <Route path="/documents" element={<Documents />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/students" element={<Students />} />
                    <Route path="/students/:id" element={<StudentDetails />} />
                    <Route path="/ai-tools" element={<AITools />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/communications" element={<Communications />} />
                  </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthInit>
          </BrowserRouter>

          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;