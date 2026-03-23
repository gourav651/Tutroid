import { DASHBOARD_CONFIG, USER_TYPES } from "../../config/dashboardConfig";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Briefcase, MapPin, Users, Clock } from "lucide-react";
import ApiService from "../../services/api";
import { useState, useEffect, useCallback } from "react";

export default function RightSidebar({ userType = USER_TYPES.STUDENT }) {
  const config = DASHBOARD_CONFIG[userType];
  const sidebarConfig = config.rightSidebar;
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [suggestedTrainers, setSuggestedTrainers] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [topRequirements, setTopRequirements] = useState([]);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [timeTick, setTimeTick] = useState(0); // Used to force re-render for time updates

  useEffect(() => {
    const loadSuggestedTrainers = async () => {
      setLoadingTrainers(true);
      try {
        const res = await ApiService.searchTrainers({ limit: 3, sort: "rating" });
        if (res?.success) {
          setSuggestedTrainers(res.data || []);
        }
      } catch {
        // Use static fallback
        setSuggestedTrainers([
          { id: "1", user: { firstName: "Raj", lastName: "Kumar" }, skills: ["React", "Node.js"], rating: 4.9 },
          { id: "2", user: { firstName: "Priya", lastName: "Sharma" }, skills: ["Python", "ML"], rating: 4.8 },
          { id: "3", user: { firstName: "Amit", lastName: "Patel" }, skills: ["AWS", "DevOps"], rating: 4.7 },
        ]);
      } finally {
        setLoadingTrainers(false);
      }
    };

    if (userType === USER_TYPES.STUDENT) {
      loadSuggestedTrainers();
    }
  }, [userType]);

  // Load top requirements - fetch more items
  const loadTopRequirements = async () => {
    setLoadingRequirements(true);
    try {
      const res = await ApiService.getTopRequirements(10);
      if (res?.success) {
        setTopRequirements(res.data || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingRequirements(false);
    }
  };

  useEffect(() => {
    loadTopRequirements();
  }, []);

  // Update relative time and refresh data every minute (to remove expired requirements)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick(prev => prev + 1);
      loadTopRequirements(); // Re-fetch to filter out expired requirements
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Listen for refresh event when a post is deleted
  useEffect(() => {
    const handleRefreshRequirements = () => {
      loadTopRequirements();
    };

    window.addEventListener("refreshTopRequirements", handleRefreshRequirements);
    return () => {
      window.removeEventListener("refreshTopRequirements", handleRefreshRequirements);
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Top Requirements Card */}
      <div className={`${theme.cardBg} rounded-xl shadow-lg border ${theme.cardBorder} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${theme.divider} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Briefcase size={15} className="text-blue-500" />
            <h3 className={`font-bold text-sm ${theme.textPrimary}`}>
              Top Requirements
            </h3>
          </div>
          <button className={`text-xs ${theme.accentColor} hover:underline flex items-center gap-1`}>
            See all <ExternalLink size={10} />
          </button>
        </div>
        <div className="p-3 space-y-3">
          {loadingRequirements ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-2.5 animate-pulse">
                  <div className={`w-10 h-10 rounded-lg ${theme.isDarkMode ? "bg-neutral-700" : "bg-gray-200"}`}></div>
                  <div className="flex-1 space-y-1.5">
                    <div className={`h-2.5 rounded ${theme.isDarkMode ? "bg-neutral-700" : "bg-gray-200"} w-24`}></div>
                    <div className={`h-2 rounded ${theme.isDarkMode ? "bg-neutral-700" : "bg-gray-200"} w-16`}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : topRequirements.length > 0 ? (
            topRequirements.map((req, index) => (
              <div
                key={req.id || index}
                className={`p-2.5 rounded-lg ${theme.hoverBg} cursor-pointer transition-all hover:shadow-sm border ${theme.cardBorder}`}
                onClick={() => navigate(`/institute/profile/${req.author?.username}`)}
              >
                <div className="flex items-start gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 overflow-hidden">
                    {req.author?.profilePicture ? (
                      <img 
                        src={req.author.profilePicture} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerText = req.author?.institutionProfile?.name?.charAt(0) || req.author?.firstName?.charAt(0) || "I";
                        }}
                      />
                    ) : (
                      req.author?.institutionProfile?.name?.charAt(0) || req.author?.firstName?.charAt(0) || "I"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${theme.textPrimary} truncate line-clamp-2`}>
                      {req.content?.substring(0, 50) || "Tutor Required"}
                      {req.content?.length > 50 && "..."}
                    </p>
                    <p className={`text-xs ${theme.textMuted} truncate`}>
                      {req.author?.institutionProfile?.name || `${req.author?.firstName || ""} ${req.author?.lastName || ""}`.trim() || "Institution"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {req.positions > 1 && (
                        <span className={`text-xs ${theme.textMuted} flex items-center gap-0.5`}>
                          <Users size={10} />
                          {req.positions}
                        </span>
                      )}
                      {req.location && (
                        <span className={`text-xs ${theme.textMuted} flex items-center gap-0.5`}>
                          <MapPin size={10} />
                          {req.location}
                        </span>
                      )}
                      {req.createdAt && (
                        <span className={`text-xs ${theme.textMuted} flex items-center gap-0.5`}>
                          <Clock size={10} />
                          {(() => {
                            // Include timeTick to force re-render every minute
                            const _tick = timeTick;
                            const date = new Date(req.createdAt);
                            const now = new Date();
                            const diffMinutes = Math.floor((now - date) / (1000 * 60));
                            const diffHours = Math.floor(diffMinutes / 60);
                            if (diffMinutes < 1) return "Just now";
                            if (diffMinutes < 60) return `${diffMinutes}m ago`;
                            if (diffHours < 24) return `${diffHours}h ago`;
                            const diffDays = Math.floor(diffHours / 24);
                            if (diffDays < 7) return `${diffDays}d ago`;
                            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Briefcase className={`w-8 h-8 mx-auto mb-2 ${theme.textMuted}`} />
              <p className={`text-sm ${theme.textMuted}`}>No requirements yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Trainers (for students) */}
      {userType === USER_TYPES.STUDENT && (
        <div className={`${theme.cardBg} rounded-xl shadow-lg border ${theme.cardBorder} overflow-hidden`}>
          <div className={`px-4 py-3 border-b ${theme.divider} flex items-center justify-between`}>
            <h3 className={`font-bold text-sm ${theme.textPrimary}`}>Top Trainers</h3>
            <button className={`text-xs ${theme.accentColor} hover:underline flex items-center gap-1`}>
              See all <ExternalLink size={10} />
            </button>
          </div>
          <div className="p-3 space-y-3">
            {loadingTrainers ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2.5 animate-pulse">
                    <div className={`w-9 h-9 rounded-full ${theme.isDarkMode ? "bg-neutral-700" : "bg-gray-200"}`}></div>
                    <div className="flex-1 space-y-1.5">
                      <div className={`h-2.5 rounded ${theme.isDarkMode ? "bg-neutral-700" : "bg-gray-200"} w-24`}></div>
                      <div className={`h-2 rounded ${theme.isDarkMode ? "bg-neutral-700" : "bg-gray-200"} w-16`}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : suggestedTrainers.map((trainer, i) => {
              const name = trainer.user
                ? `${trainer.user.firstName || ""} ${trainer.user.lastName || ""}`.trim()
                : trainer.firstName || "Trainer";
              const skills = (trainer.skills || []).slice(0, 2).join(", ");
              const rating = trainer.rating || 4.5;
              return (
                <div key={trainer.id || i} className="flex items-center gap-2.5 group">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${["from-blue-500 to-purple-600", "from-emerald-500 to-teal-600", "from-orange-500 to-red-600"][i % 3]
                    } flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${theme.textPrimary} truncate`}>{name}</p>
                    <p className={`text-xs ${theme.textMuted} truncate`}>{skills || "Expert Trainer"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-amber-500 font-bold">★ {rating}</span>
                    <button
                      onClick={() => navigate(`/trainer/profile/${trainer.id || trainer.userId}`)}
                      className={`text-xs px-2 py-0.5 rounded-full border ${theme.cardBorder} ${theme.textMuted} ${theme.hoverBg} transition-all`}
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Links */}
      <p className={`text-[10px] ${theme.textMuted} px-1 leading-relaxed`}>
        <span className="hover:underline cursor-pointer">Terms</span> ·{" "}
        <span className="hover:underline cursor-pointer">Privacy</span> ·{" "}
        <span className="hover:underline cursor-pointer">Help</span> ·{" "}
        <span className="hover:underline cursor-pointer">About</span>
        <br />
        Tutroid © 2026
      </p>
    </div>
  );
}
