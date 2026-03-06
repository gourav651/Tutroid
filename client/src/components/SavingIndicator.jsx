import { useTheme } from "../context/ThemeContext";
import { Check, Loader2 } from "lucide-react";

export default function SavingIndicator({ message = "Saving...", success = false }) {
  const { theme } = useTheme();

  if (success) {
    return (
      <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-right-full duration-300">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${theme.cardBorder} bg-green-500/10 backdrop-blur-sm`}>
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in duration-300">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              Saved successfully!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-right-full duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${theme.cardBorder} ${theme.cardBg} backdrop-blur-sm`}>
        <Loader2 className={`w-5 h-5 ${theme.accentColor} animate-spin`} />
        <div>
          <p className={`text-sm font-semibold ${theme.textPrimary}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
