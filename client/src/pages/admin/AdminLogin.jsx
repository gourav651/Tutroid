import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import ApiService from "../../services/api";
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle, ArrowLeft, KeyRound, RefreshCw } from "lucide-react";

const AdminLogin = () => {
  const { theme } = useTheme();
  const { login, logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Signup state
  const [showSignup, setShowSignup] = useState(false);
  const [signupStep, setSignupStep] = useState("signup"); // signup -> otp -> complete
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupOtp, setSignupOtp] = useState("");
  const [signupResendTimer, setSignupResendTimer] = useState(0);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState("email"); // email -> otp -> reset
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Resend timer countdown for both forgot password and signup
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (signupResendTimer > 0) {
      const interval = setInterval(() => {
        setSignupResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [signupResendTimer]);

  // Forgot password handlers
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await ApiService.adminForgotPassword({ email: forgotEmail });
      if (response.success) {
        if (response.exists) {
          setSuccess(response.message);
          setForgotStep("otp");
          setResendTimer(60); // 60 seconds cooldown
        } else {
          setError(response.message || "No admin account found with this email.");
        }
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await ApiService.adminVerifyResetOTP({ email: forgotEmail, otp });
      if (response.success) {
        setSuccess(response.message);
        setForgotStep("reset");
      } else {
        setError(response.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await ApiService.adminResetPassword({
        email: forgotEmail,
        otp,
        newPassword,
      });
      if (response.success) {
        setSuccess(response.message);
        // Reset form and go back to login after a delay
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotStep("email");
          setForgotEmail("");
          setOtp("");
          setNewPassword("");
          setConfirmPassword("");
          setSuccess("");
        }, 2000);
      } else {
        setError(response.message || "Failed to reset password");
      }
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await ApiService.adminForgotPassword({ email: forgotEmail });
      if (response.success && response.exists) {
        setSuccess("OTP resent successfully. Please check your inbox.");
        setResendTimer(60);
      } else {
        setError("Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep("email");
    setForgotEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setResendTimer(0);
  };

  // Signup handler
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (signupData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await ApiService.adminSignup({
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        email: signupData.email,
        password: signupData.password,
      });

      if (response.success) {
        setSuccess("Verification OTP sent to your email. Please verify to complete admin account creation.");
        setSignupStep("otp");
        setSignupResendTimer(60); // 60 seconds cooldown
      } else {
        setError(response.message || "Failed to create admin account");
      }
    } catch (err) {
      setError(err.message || "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  };

  // Verify signup OTP
  const handleVerifySignupOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await ApiService.adminVerifySignupOTP({
        email: signupData.email,
        otp: signupOtp,
      });

      if (response.success) {
        setSuccess("Admin account verified and activated successfully! You can now log in.");
        setSignupStep("complete");
        // Reset signup form and switch to login after delay
        setTimeout(() => {
          resetSignup();
          setFormData({ ...formData, email: signupData.email });
        }, 2000);
      } else {
        setError(response.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Resend signup OTP
  const handleResendSignupOTP = async () => {
    if (signupResendTimer > 0) return;
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await ApiService.adminResendSignupOTP({ email: signupData.email });
      if (response.success) {
        setSuccess("New verification OTP sent to your email.");
        setSignupResendTimer(60);
      } else {
        setError("Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetSignup = () => {
    setShowSignup(false);
    setSignupStep("signup");
    setSignupData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setSignupOtp("");
    setSignupResendTimer(0);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // If already logged in as non-admin, logout first
      if (isAuthenticated && user?.role !== "ADMIN") {
        logout();
      }

      const response = await login(formData);
      
      if (response.success) {
        // Check if user is admin
        if (response.data?.user?.role === "ADMIN") {
          navigate("/admin");
        } else {
          setError("Access denied. Admin privileges required.");
          // Logout if not admin
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Render signup UI
  if (showSignup) {
    return (
      <div className={`min-h-screen ${theme.bgPrimary} flex items-center justify-center p-4`}>
        <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-xl w-full max-w-md p-8`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
              {signupStep === "signup" && "Create Admin Account"}
              {signupStep === "otp" && "Verify Your Email"}
              {signupStep === "complete" && "Account Created"}
            </h1>
            <p className={`${theme.textSecondary} mt-2`}>
              {signupStep === "signup" && "Register as a new administrator"}
              {signupStep === "otp" && "Enter the 6-digit OTP sent to your email"}
              {signupStep === "complete" && "Your admin account has been successfully created"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          {/* Signup Form - Step 1: Registration */}
          {signupStep === "signup" && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={signupData.firstName}
                    onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                    placeholder="John"
                    className={`w-full px-3 py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={signupData.lastName}
                    onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                    placeholder="Doe"
                    className={`w-full px-3 py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
                  <input
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="admin@example.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    placeholder="Enter password"
                    minLength={6}
                    className={`w-full pl-10 pr-12 py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.textSecondary}`}
                  >
                    {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    minLength={6}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Create Admin Account
                  </>
                )}
              </button>
            </form>
          )}

          {/* Signup Form - Step 2: OTP Verification */}
          {signupStep === "otp" && (
            <form onSubmit={handleVerifySignupOTP} className="space-y-4 sm:space-y-6">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  Enter OTP
                </label>
                <div className="relative">
                  <Shield className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${theme.textMuted}`} />
                  <input
                    type="text"
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl sm:text-2xl tracking-wider sm:tracking-widest`}
                    required
                  />
                </div>
                <p className={`text-xs ${theme.textMuted} mt-2 text-center`}>
                  OTP sent to {signupData.email}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || signupOtp.length !== 6}
                className="w-full py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                    Verify & Create Account
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendSignupOTP}
                  disabled={signupResendTimer > 0 || loading}
                  className={`text-xs sm:text-sm ${signupResendTimer > 0 ? theme.textMuted : "text-blue-600 hover:text-blue-700"} transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 mx-auto`}
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading && "animate-spin"}`} />
                  {signupResendTimer > 0 ? `Resend OTP in ${signupResendTimer}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {/* Signup Form - Step 3: Complete */}
          {signupStep === "complete" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
                  Account Created Successfully!
                </h3>
                <p className={`${theme.textSecondary}`}>
                  Your admin account has been verified and activated. You can now log in with your credentials.
                </p>
              </div>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={resetSignup}
              className={`flex items-center justify-center gap-2 w-full text-sm ${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>

          {/* Security Notice */}
          <div className={`mt-8 pt-6 border-t ${theme.cardBorder} text-center`}>
            <p className={`text-xs ${theme.textMuted}`}>
              Admin account creation for authorized personnel only.
              <br />
              All registrations are logged and monitored.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render forgot password UI
  if (showForgotPassword) {
    return (
      <div className={`min-h-screen ${theme.bgPrimary} flex items-center justify-center p-4`}>
        <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-xl w-full max-w-md p-8`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
              Reset Admin Password
            </h1>
            <p className={`${theme.textSecondary} mt-2`}>
              {forgotStep === "email" && "Enter your admin email to receive OTP"}
              {forgotStep === "otp" && "Enter the 6-digit OTP sent to your email"}
              {forgotStep === "reset" && "Create a new password for your account"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          {/* Step 1: Email Form */}
          {forgotStep === "email" && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send OTP
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {forgotStep === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-6">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  Enter OTP
                </label>
                <div className="relative">
                  <Shield className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${theme.textMuted}`} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl sm:text-2xl tracking-wider sm:tracking-widest`}
                    required
                  />
                </div>
                <p className={`text-xs ${theme.textMuted} mt-2 text-center`}>
                  OTP sent to {forgotEmail}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                    Verify OTP
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || loading}
                  className={`text-xs sm:text-sm ${resendTimer > 0 ? theme.textMuted : "text-blue-600 hover:text-blue-700"} transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 mx-auto`}
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading && "animate-spin"}`} />
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {forgotStep === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    minLength={6}
                    className={`w-full pl-10 pr-12 py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.textSecondary}`}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    minLength={6}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={resetForgotPassword}
              className={`flex items-center justify-center gap-2 w-full text-sm ${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>

          {/* Security Notice */}
          <div className={`mt-8 pt-6 border-t ${theme.cardBorder} text-center`}>
            <p className={`text-xs ${theme.textMuted}`}>
              Secure password reset for authorized administrators only.
              <br />
              All reset attempts are logged and monitored.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bgPrimary} flex items-center justify-center p-4`}>
      <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-xl w-full max-w-md p-8`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
            Admin Portal
          </h1>
          <p className={`${theme.textSecondary} mt-2`}>
            Secure access for administrators only
          </p>
          {isAuthenticated && user?.role !== "ADMIN" && (
            <p className="mt-3 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full inline-block">
              Currently logged in as {user?.role}. Please login as Admin.
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              Admin Email
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                className={`w-full pl-10 pr-12 py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.textSecondary}`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Sign In as Admin
              </>
            )}
          </button>
        </form>

        {/* Forgot Password Link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className={`text-sm text-blue-600 hover:text-blue-700 transition-colors`}
          >
            Forgot Password?
          </button>
        </div>

        {/* Signup Link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowSignup(true)}
            className={`w-full py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2`}
          >
            <Shield className="w-4 h-4" />
            Create Admin Account
          </button>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center space-y-2">
          <button
            onClick={() => navigate("/")}
            className={`flex items-center justify-center gap-2 w-full text-sm ${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>

        {/* Security Notice */}
        <div className={`mt-8 pt-6 border-t ${theme.cardBorder} text-center`}>
          <p className={`text-xs ${theme.textMuted}`}>
            This area is restricted to authorized personnel only.
            <br />
            All login attempts are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
