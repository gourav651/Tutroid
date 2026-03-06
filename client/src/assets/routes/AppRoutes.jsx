import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LandingPage from "../pages/LandingPage";
import SignupPage from "../pages/SignupPage";
import LoginPage from "../pages/LoginPage";
import ForgotPassword from "../pages/ForgotPassword";
import VerifyOTP from "../pages/VerifyOTP";
import ResetPassword from "../pages/ResetPassword";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import Dashboard from "../pages/StudentHome";
import ProfilePage from "../pages/ProfilePage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ProtectedRoute from "../../components/ProtectedRoute";
import AdminDashboard, { AdminOverview, AdminSettings } from "../../pages/admin/AdminDashboard";
import AdminUsers from "../../pages/admin/AdminUsers";
import AdminReports from "../../pages/admin/AdminReports";
import AdminAnalytics from "../../pages/admin/AdminAnalytics";
import AdminLogin from "../../pages/admin/AdminLogin";
import Reviews from "../pages/trainer/Reviews";
import { USER_TYPES } from "../../config/dashboardConfig";

// Admin route guard component - always shows login if not admin
const AdminRouteGuard = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Only allow access if authenticated as admin
  if (isAuthenticated && user?.role === "ADMIN") {
    return <Outlet />;
  }
  
  // Otherwise show admin login (even if logged in as other user)
  return <AdminLogin />;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <Dashboard userType={USER_TYPES.STUDENT} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer"
          element={
            <ProtectedRoute requiredRole="TRAINER">
              <Dashboard userType={USER_TYPES.TRAINER} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/institute"
          element={
            <ProtectedRoute requiredRole="INSTITUTION">
              <Dashboard userType={USER_TYPES.INSTITUTE} />
            </ProtectedRoute>
          }
        />

        {/* Protected Profile Routes - Using username */}
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute>
              <ProfilePage userType={USER_TYPES.STUDENT} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile/:username"
          element={
            <ProtectedRoute>
              <ProfilePage userType={USER_TYPES.STUDENT} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/profile"
          element={
            <ProtectedRoute>
              <ProfilePage userType={USER_TYPES.TRAINER} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/profile/:username"
          element={
            <ProtectedRoute>
              <ProfilePage userType={USER_TYPES.TRAINER} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/institute/profile"
          element={
            <ProtectedRoute>
              <ProfilePage userType={USER_TYPES.INSTITUTE} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/institute/profile/:username"
          element={
            <ProtectedRoute>
              <ProfilePage userType={USER_TYPES.INSTITUTE} />
            </ProtectedRoute>
          }
        />

        {/* Trainer Specific Routes */}
        <Route
          path="/trainer/reviews"
          element={
            <ProtectedRoute requiredRole="TRAINER">
              <Reviews />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Special login flow */}
        <Route path="/admin" element={<AdminRouteGuard />}>
          <Route element={<AdminDashboard />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
