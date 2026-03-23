import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_PROFILE_IMAGE } from "../utils/constants";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RequirementCard({ requirement, onClick }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeTick, setTimeTick] = useState(0); // Force re-render for time updates

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const normalizeImageUrl = (url) => {
    if (!url) return DEFAULT_PROFILE_IMAGE;
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${BACKEND_URL}${url}`;
  };

  const authorName = requirement.author?.institutionProfile?.name ||
    (requirement.author?.firstName
      ? `${requirement.author.firstName} ${requirement.author.lastName || ""}`.trim()
      : "Institution");

  const authorImage = normalizeImageUrl(requirement.author?.profilePicture);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "1 day left";
    if (diffDays <= 7) return `${diffDays} days left`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatCreatedAt = (dateString) => {
    // Include timeTick to force re-render every minute
    const _tick = timeTick;
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const requirements = requirement.requirements || [];
  const isExpired = requirement.deadline && new Date(requirement.deadline) < new Date();

  return (
    <div
      className={`${theme.cardBg} rounded-xl shadow-sm border ${theme.cardBorder} overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer ${isExpired ? 'opacity-60' : ''}`}
      onClick={() => onClick && onClick(requirement)}
    >
      {/* Requirement Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Company/Institution Logo */}
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            {authorImage && authorImage !== DEFAULT_PROFILE_IMAGE ? (
              <img
                src={authorImage}
                alt={authorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Briefcase className="w-6 h-6 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-base ${theme.textPrimary} truncate`}>
              {requirement.content?.substring(0, 60) || "Tutor Required"}
              {requirement.content?.length > 60 && "..."}
            </h3>
            <p className={`text-sm ${theme.textSecondary} flex items-center gap-1`}>
              {authorName}
            </p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {requirement.location && (
                <span className={`text-xs ${theme.textMuted} flex items-center gap-1`}>
                  <MapPin size={12} />
                  {requirement.location}
                </span>
              )}
              <span className={`text-xs ${theme.textMuted} flex items-center gap-1`}>
                <Clock size={12} />
                {formatCreatedAt(requirement.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Requirement Details */}
        <div className="mt-4 flex flex-wrap gap-3">
          {/* Positions */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${theme.isDarkMode ? "bg-emerald-900/30" : "bg-emerald-50"}`}>
            <Users size={14} className="text-emerald-500" />
            <span className={`text-xs font-medium ${theme.isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}>
              {requirement.positions || 1} Position{(requirement.positions || 1) > 1 ? "s" : ""}
            </span>
          </div>

          {/* Salary */}
          {requirement.salary && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${theme.isDarkMode ? "bg-amber-900/30" : "bg-amber-50"}`}>
              <DollarSign size={14} className="text-amber-500" />
              <span className={`text-xs font-medium ${theme.isDarkMode ? "text-amber-300" : "text-amber-700"}`}>
                {requirement.salary}
              </span>
            </div>
          )}

          {/* Deadline */}
          {requirement.deadline && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${isExpired ? (theme.isDarkMode ? "bg-red-900/30" : "bg-red-50") : (theme.isDarkMode ? "bg-blue-900/30" : "bg-blue-50")}`}>
              <Calendar size={14} className={isExpired ? "text-red-500" : "text-blue-500"} />
              <span className={`text-xs font-medium ${isExpired ? (theme.isDarkMode ? "text-red-300" : "text-red-700") : (theme.isDarkMode ? "text-blue-300" : "text-blue-700")}`}>
                {formatDate(requirement.deadline)}
              </span>
            </div>
          )}
        </div>

        {/* Required Skills */}
        {requirements.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {requirements.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className={`px-2 py-0.5 text-xs rounded-full ${theme.isDarkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"}`}
              >
                {skill}
              </span>
            ))}
            {requirements.length > 4 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${theme.isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}>
                +{requirements.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`px-4 py-3 border-t ${theme.divider} flex justify-between items-center`}>
        <span className={`text-xs ${theme.textMuted} flex items-center gap-1`}>
          <Briefcase size={12} />
          Tutor Requirement
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/institute/profile/${requirement.author?.username}`);
          }}
          className={`text-xs ${theme.accentColor} hover:underline flex items-center gap-1`}
        >
          View Profile <ExternalLink size={10} />
        </button>
      </div>
    </div>
  );
}
