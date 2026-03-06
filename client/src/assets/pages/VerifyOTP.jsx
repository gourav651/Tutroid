import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/api";
import { KeyRound, ArrowLeft, Loader2, RefreshCw } from "lucide-react";

const VerifyOTP = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const email = location.state?.email || "";

  // Redirect if no email
  if (!email) {
    return (
      <div className={`min-h-screen ${theme.bgPrimary} flex items-center justify-center p-4`}>
        <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-xl w-full max-w-md p-8 text-center`}>
          <p className={`${theme.textSecondary} mb-4`}>Please start from the forgot password page.</p>
          <Link
            to="/forgot-password"
            className="inline-block py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Forgot Password
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await ApiService.verifyResetOTP({ email, otp });
      if (response.success) {
        navigate("/reset-password", { state: { email, otp } });
      } else {
        setError(response.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");

    try {
      const response = await ApiService.forgotPassword({ email });
      if (response.success) {
        alert("OTP resent successfully!");
      }
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.bgPrimary} flex items-center justify-center p-4`}>
      <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-xl w-full max-w-md p-8`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>Enter OTP</h1>
          <p className={`${theme.textSecondary} mt-2`}>
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              OTP Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(value);
              }}
              placeholder="000000"
              maxLength={6}
              className={`w-full px-4 py-3 text-center text-2xl tracking-[0.5em] rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            <p className={`mt-2 text-xs ${theme.textMuted}`}>
              OTP expires in 10 minutes
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify OTP"
            )}
          </button>
        </form>

        {/* Resend & Back */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className={`flex items-center justify-center gap-2 w-full text-sm ${theme.textMuted} hover:${theme.textSecondary} transition-colors disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${resendLoading ? "animate-spin" : ""}`} />
            {resendLoading ? "Resending..." : "Didn't receive it? Resend OTP"}
          </button>

          <Link
            to="/forgot-password"
            className={`flex items-center justify-center gap-2 text-sm ${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Change Email
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
