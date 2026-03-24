import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { X, Briefcase, MapPin, Users, Clock, ExternalLink } from "lucide-react";
import ApiService from "../../services/api";

export default function TopRequirementsPanel({ isOpen, onClose }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [topRequirements, setTopRequirements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTopRequirements();
    }
  }, [isOpen]);

  const loadTopRequirements = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getTopRequirements(10);
      if (res?.success) {
        setTopRequirements(res.data || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
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

  const handleRequirementClick = (req) => {
    navigate(`/institute/profile/${req.author?.username}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-sm ${theme.cardBg} shadow-2xl z-50 animate-slide-in-right overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 ${theme.cardBg} border-b ${theme.cardBorder} p-4 flex items-center justify-between z-10`}
        >
          <div className="flex items-center gap-2">
            <Briefcase size={20} className="text-blue-500" />
            <h2 className={`font-bold text-lg ${theme.textPrimary}`}>
              Top Requirements
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.hoverBg} transition-colors`}
          >
            <X size={20} className={theme.textSecondary} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full" />
            </div>
          ) : topRequirements.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className={`w-12 h-12 mx-auto mb-3 ${theme.textMuted}`} />
              <p className={`${theme.textMuted}`}>No requirements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topRequirements.map((req, index) => (
                <div
                  key={req.id || index}
                  onClick={() => handleRequirementClick(req)}
                  className={`p-3 rounded-lg ${theme.hoverBg} cursor-pointer transition-all border ${theme.cardBorder}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 overflow-hidden">
                      {req.author?.profilePicture ? (
                        <img
                          src={req.author.profilePicture}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        req.author?.institutionProfile?.name?.charAt(0) ||
                        req.author?.firstName?.charAt(0) ||
                        "I"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${theme.textPrimary} line-clamp-2`}
                      >
                        {req.content?.substring(0, 60) || "Tutor Required"}
                        {req.content?.length > 60 && "..."}
                      </p>
                      <p className={`text-xs ${theme.textMuted} truncate`}>
                        {req.author?.institutionProfile?.name ||
                          `${req.author?.firstName || ""} ${req.author?.lastName || ""}`.trim() ||
                          "Institution"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {req.positions > 1 && (
                          <span
                            className={`text-xs ${theme.textMuted} flex items-center gap-0.5`}
                          >
                            <Users size={10} />
                            {req.positions}
                          </span>
                        )}
                        {req.location && (
                          <span
                            className={`text-xs ${theme.textMuted} flex items-center gap-0.5`}
                          >
                            <MapPin size={10} />
                            {req.location}
                          </span>
                        )}
                        {req.createdAt && (
                          <span
                            className={`text-xs ${theme.textMuted} flex items-center gap-0.5`}
                          >
                            <Clock size={10} />
                            {formatTimeAgo(req.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
