import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div
        className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-8 max-w-md w-full text-center`}
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className={`text-2xl font-bold ${theme.textPrimary} mb-4`}>
          Access Denied
        </h1>

        <p className={`${theme.textSecondary} mb-8`}>
          You don't have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <button
            onClick={() => navigate("/")}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${theme.accentBg} text-white hover:opacity-90 transition-opacity`}
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
