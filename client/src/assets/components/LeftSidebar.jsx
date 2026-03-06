import { DASHBOARD_CONFIG, USER_TYPES } from "../../config/dashboardConfig";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import ApiService from "../../services/api";

export default function LeftSidebar({ userType = USER_TYPES.STUDENT }) {
  const config = DASHBOARD_CONFIG[userType];
  const profile = config.leftSidebar.profile;
  const menuItems = config.leftSidebar.menuItems;
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [profileSummary, setProfileSummary] = useState(null);

  // Fetch comprehensive profile summary
  useEffect(() => {
    const fetchProfileSummary = async () => {
      try {
        const response = await ApiService.getProfileSummary();
        if (response.success && response.data) {
          setProfileSummary(response.data);

          // Update current profile with fetched data
          const {
            user,
            trainerProfile,
            institutionProfile,
            currentEducation,
            currentExperience,
          } = response.data;
          setCurrentProfile((prev) => ({
            ...prev,
            name:
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.firstName || user.email?.split("@")[0] || prev.name,
            avatar: user.profilePicture || prev.avatar,
            headline: user.headline || prev.headline,
            location:
              user.location ||
              trainerProfile?.location ||
              institutionProfile?.location ||
              prev.location,
            bio: user.bio || trainerProfile?.bio || prev.bio,
            skills: trainerProfile?.skills || prev.skills,
            experience: trainerProfile?.experience || prev.experience,
            rating: trainerProfile?.rating || prev.rating,
            currentEducation,
            currentExperience,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch profile summary:", error);
      }
    };

    fetchProfileSummary();
  }, [userType]);

  // Listen for profile updates from ProfilePage
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      const updatedData = event.detail;
      setCurrentProfile((prev) => ({
        ...prev,
        name: updatedData.name || prev.name,
        avatar: updatedData.avatar || prev.avatar,
        headline: updatedData.headline || prev.headline,
        location: updatedData.location || prev.location,
      }));
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () =>
      window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  // Also sync with AuthContext user changes
  useEffect(() => {
    if (authUser) {
      setCurrentProfile((prev) => ({
        ...prev,
        name: authUser.name || authUser.firstName || prev.name,
        avatar: authUser.avatar || authUser.profilePicture || prev.avatar,
      }));
    }
  }, [authUser]);

  const handleProfileClick = () => {
    if (userType === USER_TYPES.STUDENT) {
      navigate("/student/profile");
    } else if (userType === USER_TYPES.TRAINER) {
      navigate("/trainer/profile");
    } else if (userType === USER_TYPES.INSTITUTE) {
      navigate("/institute/profile");
    }
  };

  // Different stats based on user type
  const getStats = () => {
    if (userType === USER_TYPES.TRAINER) {
      return [
        {
          label: "Students",
          value: currentProfile.studentsCount,
          color: theme.statEmerald,
        },
      ];
    }
    if (userType === USER_TYPES.INSTITUTE) {
      return [
        {
          label: "Trainers",
          value: currentProfile.trainersCount,
          color: theme.statBlue,
        },
        {
          label: "Students",
          value: currentProfile.studentsCount,
          color: theme.statEmerald,
        },
      ];
    }
    return [
      {
        label: "Profile viewers",
        value: currentProfile.profileViewers,
        color: theme.statBlue,
      },
    ];
  };

  const stats = getStats();

  return (
    <div className="hidden md:block space-y-4">
      {/* Profile Card */}
      <div
        onClick={handleProfileClick}
        className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.cardBorder} transition-all duration-300 cursor-pointer hover:shadow-xl overflow-hidden`}
      >
        {/* Profile Header Section */}
        <div className="p-5 sm:p-6 text-center">
          <div className="relative inline-block mb-4">
            <img
              src={currentProfile.avatar}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto object-cover ring-4 ${theme.accentBg}/30 ring-offset-2 ${theme.isDarkMode ? "ring-offset-slate-800" : "ring-offset-white"} transition-all duration-300 hover:scale-105`}
              alt={currentProfile.name}
            />
            <div
              className={`absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 ${theme.isDarkMode ? "border-slate-800" : "border-white"} shadow-lg transition-colors duration-300`}
            ></div>
          </div>

          <h3
            className={`font-bold text-lg sm:text-xl ${theme.textPrimary} transition-colors duration-300 flex items-center justify-center gap-2 mb-1`}
          >
            {currentProfile.name}
            {authUser?.isVerified && (
              <CheckCircle2
                className="w-5 h-5 text-blue-500 flex-shrink-0"
                title="Verified"
              />
            )}
          </h3>
          <p
            className={`text-sm sm:text-base ${theme.accentColor} font-medium transition-colors duration-300 px-2`}
          >
            {currentProfile.headline || currentProfile.role}
          </p>

          {/* Location */}
          {currentProfile.location && (
            <div className="flex items-center justify-center mt-1 pr-2">
              <span className="text-base">📍</span>
              <p
                className={`text-sm ${theme.textMuted} transition-colors duration-300`}
              >
                {currentProfile.location}
              </p>
            </div>
          )}
        </div>

        {/* Profile Details Section */}
        {(currentProfile.bio || currentProfile.currentEducation || currentProfile.currentExperience) && (
          <div className={`px-5 sm:px-20  ${theme.isDarkMode ? "bg-slate-800/30" : "bg-gray-50/50"}`}>
            {/* Bio/Summary */}
            {currentProfile.bio && (
              <div>
                <p
                  className={`text-sm ${theme.textSecondary} transition-colors duration-300 line-clamp-3 text-center leading-relaxed`}
                >
                  {currentProfile.bio}
                </p>
              </div>
            )}

            {/* Current Education - LinkedIn Style */}
            {currentProfile.currentEducation && (
              <div
                className={`flex items-start gap-2.5 p-3 rounded-lg ${theme.isDarkMode ? "bg-slate-700/30" : "bg-white"} transition-all duration-300`}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">🎓</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${theme.textPrimary} font-medium line-clamp-2 leading-snug`}>
                    {currentProfile.currentEducation.school}
                  </p>
                  {(currentProfile.currentEducation.degree || currentProfile.currentEducation.fieldOfStudy) && (
                    <p className={`text-xs ${theme.textMuted} mt-1 line-clamp-1`}>
                      {currentProfile.currentEducation.degree}
                      {currentProfile.currentEducation.degree && currentProfile.currentEducation.fieldOfStudy && " • "}
                      {currentProfile.currentEducation.fieldOfStudy}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Current Experience - LinkedIn Style */}
            {currentProfile.currentExperience && (
              <div
                className={`flex items-start gap-2.5 p-3 ml-2 rounded-lg ${theme.isDarkMode ? "bg-slate-700/30" : "bg-white"} transition-all duration-300`}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">💼</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${theme.textPrimary} font-medium line-clamp-1 leading-snug`}>
                    {currentProfile.currentExperience.title}
                  </p>
                  <p className={`text-xs ${theme.textMuted} mt-1 line-clamp-1`}>
                    {currentProfile.currentExperience.company}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Section */}
        {userType !== USER_TYPES.INSTITUTE && (
          <div className={`px-5 sm:px-6 py-4 border-t ${theme.divider}`}>
            {userType === USER_TYPES.TRAINER ? (
              <div className="space-y-4">
                {/* Skills Section */}
                {currentProfile.skills && currentProfile.skills.length > 0 && (
                  <div className="text-center">
                    <p
                      className={`text-xs ${theme.textMuted} uppercase tracking-wider font-semibold transition-colors duration-300 mb-3`}
                    >
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {currentProfile.skills.slice(0, 4).map((skill, index) => (
                        <span
                          key={index}
                          className={`text-xs px-3 py-1.5 rounded-full ${theme.accentBg}/20 ${theme.accentColor} border ${theme.cardBorder} font-medium hover:${theme.accentBg}/30 transition-all duration-200`}
                        >
                          {skill}
                        </span>
                      ))}
                      {currentProfile.skills.length > 4 && (
                        <span
                          className={`text-xs px-3 py-1.5 rounded-full ${theme.accentBg}/20 ${theme.accentColor} font-medium`}
                        >
                          +{currentProfile.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience Years */}
                {currentProfile.experience > 0 && (
                  <div className="text-center pt-2">
                    <p
                      className={`text-xs ${theme.textMuted} uppercase tracking-wider font-semibold transition-colors duration-300 mb-2`}
                    >
                      Experience
                    </p>
                    <p
                      className={`text-2xl font-bold ${theme.accentColor} transition-colors duration-300`}
                    >
                      {currentProfile.experience}{" "}
                      <span className="text-base font-medium">
                        {currentProfile.experience === 1 ? "year" : "years"}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`grid ${stats.length > 1 ? "grid-cols-2 divide-x" : "grid-cols-1"} ${theme.divider}`}
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center px-2">
                    <p
                      className={`text-xs ${theme.textMuted} uppercase tracking-wider font-semibold transition-colors duration-300 mb-2`}
                    >
                      {stat.label}
                    </p>
                    <p
                      className={`text-2xl font-bold ${stat.color} transition-colors duration-300`}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Menu - Hidden for Institute */}
      {userType !== USER_TYPES.INSTITUTE && (
        <div
          className={`${theme.cardBg} rounded-xl shadow-lg p-4 space-y-1 border ${theme.cardBorder} transition-all duration-300`}
        >
          {menuItems.map((item) => {
          const handleClick = () => {
            // Navigate based on item id and user type
            if (userType === USER_TYPES.TRAINER) {
              if (item.id === "reviews") {
                navigate("/trainer/reviews");
              }
            } else if (userType === USER_TYPES.STUDENT) {
              if (item.id === "saved-courses") {
                navigate("/student/courses");
              } else if (item.id === "groups") {
                navigate("/student/groups");
              } else if (item.id === "events") {
                navigate("/student/events");
              } else if (item.id === "certificates") {
                navigate("/student/certificates");
              }
            } else if (userType === USER_TYPES.INSTITUTE) {
              if (item.id === "find-trainers") {
                navigate("/institute/find-trainers");
              } else if (item.id === "hired-trainers") {
                navigate("/institute/hired-trainers");
              } else if (item.id === "post-job") {
                navigate("/institute/post-job");
              }
            }
          };

          return (
            <p
              key={item.id}
              onClick={handleClick}
              className={`px-3 py-2.5 rounded-lg ${theme.hoverBg} cursor-pointer transition-all duration-300 ${theme.textSecondary} ${theme.hoverText} flex items-center gap-3 hover:translate-x-1`}
            >
              <span className="text-sm">{item.label}</span>
            </p>
          );
        })}
      </div>
      )}
    </div>
  );
}
