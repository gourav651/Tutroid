import { DASHBOARD_CONFIG, USER_TYPES } from "../../config/dashboardConfig";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ExternalLink, Zap } from "lucide-react";
import ApiService from "../../services/api";
import { useState, useEffect } from "react";

const TRENDING_TOPICS = [
  { tag: "#AISkills", posts: "2.4K posts", hot: true },
  { tag: "#ReactJS", posts: "1.8K posts", hot: false },
  { tag: "#DataScience", posts: "3.1K posts", hot: true },
  { tag: "#CloudComputing", posts: "956 posts", hot: false },
  { tag: "#MachineLearning", posts: "4.2K posts", hot: true },
];

export default function RightSidebar({ userType = USER_TYPES.STUDENT }) {
  const config = DASHBOARD_CONFIG[userType];
  const sidebarConfig = config.rightSidebar;
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [suggestedTrainers, setSuggestedTrainers] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);

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

  return (
    <div className="space-y-3">
      {/* Insights Card */}
      <div className={`${theme.cardBg} rounded-xl shadow-lg border ${theme.cardBorder} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${theme.divider} flex items-center gap-2`}>
          <Zap size={15} className={theme.accentColor} />
          <h3 className={`font-bold text-sm ${theme.textPrimary}`}>
            {sidebarConfig.title}
          </h3>
        </div>
        <ul className="p-3 space-y-2">
          {sidebarConfig.items.map((item, index) => (
            <li
              key={index}
              className={`${theme.hoverBg} ${theme.hoverText} cursor-pointer transition-all duration-200 hover:translate-x-1 flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${theme.textSecondary} text-sm`}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Trending Topics */}
      <div className={`${theme.cardBg} rounded-xl shadow-lg border ${theme.cardBorder} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${theme.divider} flex items-center gap-2`}>
          <TrendingUp size={15} className="text-orange-500" />
          <h3 className={`font-bold text-sm ${theme.textPrimary}`}>Trending Topics</h3>
        </div>
        <ul className="p-3 space-y-1">
          {TRENDING_TOPICS.map((topic) => (
            <li key={topic.tag}>
              <button className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg ${theme.hoverBg} transition-all group`}>
                <div className="flex items-center gap-2">
                  {topic.hot && <span className="text-xs">🔥</span>}
                  <span className={`text-sm font-medium ${theme.accentColor}`}>{topic.tag}</span>
                </div>
                <span className={`text-xs ${theme.textMuted}`}>{topic.posts}</span>
              </button>
            </li>
          ))}
        </ul>
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
