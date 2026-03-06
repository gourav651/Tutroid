import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/api";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await ApiService.forgotPassword({ email });
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen ${theme.bgPrimary} flex items-center justify-center p-4`}>
        <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-xl w-full max-w-md p-8 text-center`}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>Check Your Email</h2>
          <p className={`${theme.textSecondary} mb-6`}>
            If an account exists with <strong>{email}</strong>, you will receive an OTP shortly.
          </p>
          <Link
            to="/verify-otp"
            state={{ email }}
            className="block w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mb-3"
          >
            Enter OTP
          </Link>
          <button
            onClick={() => setSuccess(false)}
            className={`text-sm ${theme.textMuted} hover:${theme.textSecondary}`}
          >
            Didn't receive it? Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bgPrimary} flex items-center justify-center p-4`}>
      <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} shadow-xl w-full max-w-md p-8`}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>Forgot Password?</h1>
          <p className={`${theme.textSecondary} mt-2`}>
            Enter your email and we'll send you an OTP to reset your password.
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
              Email Address
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className={`flex items-center justify-center gap-2 text-sm ${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
