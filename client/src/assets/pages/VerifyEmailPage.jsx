import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowRight, AlertTriangle, CheckCircle, Loader } from "lucide-react";
import ApiService from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import LoadingScreen from "../../components/LoadingScreen";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const email = location.state?.email;
  const fromSignup = location.state?.fromSignup;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    document.getElementById(`otp-${lastIndex}`)?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);

    try {
      const response = await ApiService.verifyEmail({ email, otp: otpString });
      setSuccess(true);

      // If from signup, log the user in automatically
      if (fromSignup && response.data?.token) {
        // Store token and user data
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        setTimeout(() => {
          // Navigate to appropriate dashboard based on role
          const userRole = response.data.user.role.toLowerCase();
          const roleRoutes = {
            student: "/student",
            trainer: "/trainer",
            institution: "/institute",
            admin: "/admin",
          };
          navigate(roleRoutes[userRole] || "/student");
          window.location.reload(); // Reload to update auth context
        }, 2000);
      } else {
        // From forgot password or other flow - go to login
        setTimeout(() => {
          navigate("/login", { state: { message: "Email verified! Please log in." } });
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError("");
    setResendSuccess(false);

    try {
      await ApiService.resendVerificationOTP({ email });
      setResendSuccess(true);
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();

      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) return null;

  // Show loading screen during verification or success redirect
  if (isLoading || success) {
    return <LoadingScreen message={success ? "Verification successful" : "Verifying your email"} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-3 sm:px-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-3 sm:mb-4">
            <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            We've sent a 6-digit code to
            <br />
            <span className="font-semibold text-gray-900 break-all">{email}</span>
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-green-600 font-medium">Email verified successfully!</p>
                <p className="text-green-500 text-sm mt-1">
                  {fromSignup ? "Logging you in..." : "Redirecting to login..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Resend Success */}
        {resendSuccess && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-blue-600 font-medium">New OTP sent to your email!</p>
            </div>
          </div>
        )}

        {/* OTP Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-1.5 sm:gap-3 justify-center mb-4 sm:mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  disabled={isLoading || success}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || success || otp.join("").length !== 6}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 sm:py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Verifying...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Verified!
                </>
              ) : (
                <>
                  Verify Email
                  <ArrowRight size={18} className="sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOtp}
              disabled={resendLoading || success}
              className="text-blue-600 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {resendLoading ? "Sending..." : "Resend OTP"}
            </button>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
              Wrong email?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-blue-600 font-semibold hover:underline"
              >
                Go back to signup
              </button>
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-gray-500 text-xs">
            The OTP will expire in 10 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
