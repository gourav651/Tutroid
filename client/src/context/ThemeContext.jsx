import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Check localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Default to system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    // Theme classes for easy access - BLACK & BLUE COMBO FOR DARK MODE
    bg: isDarkMode ? "bg-black" : "bg-gray-100",
    cardBg: isDarkMode ? "bg-neutral-900/90 backdrop-blur-sm" : "bg-white",
    cardBorder: isDarkMode ? "border-blue-500/30" : "border-gray-200",
    textPrimary: isDarkMode ? "text-white" : "text-gray-800",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    navbarBg: isDarkMode
      ? "bg-linear-to-r from-black via-neutral-900 to-black"
      : "bg-linear-to-r from-white via-gray-50 to-white",
    navbarBorder: isDarkMode ? "border-blue-500/50" : "border-gray-200",
    inputBg: isDarkMode ? "bg-neutral-800/80" : "bg-gray-100",
    inputBorder: isDarkMode ? "border-blue-500/40" : "border-gray-300",
    inputText: isDarkMode ? "text-white" : "text-gray-800",
    inputPlaceholder: isDarkMode
      ? "placeholder-blue-300/50"
      : "placeholder-gray-500",
    hoverBg: isDarkMode ? "hover:bg-blue-500/20" : "hover:bg-gray-100",
    hoverText: isDarkMode ? "hover:text-blue-400" : "hover:text-blue-600",
    divider: isDarkMode ? "border-blue-500/30" : "border-gray-200",
    accentColor: isDarkMode ? "text-blue-400" : "text-blue-600",
    accentBg: isDarkMode ? "bg-blue-500" : "bg-blue-600",
    statBlue: isDarkMode ? "text-blue-400" : "text-blue-600",
    statEmerald: isDarkMode ? "text-cyan-400" : "text-emerald-600",
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
