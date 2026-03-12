import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, Filter, Star, MapPin, Briefcase, User, Loader, ChevronDown, Award, TrendingUp, CheckCircle2 } from "lucide-react";
import ApiService from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const DiscoveryPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();

  // Determine what the user can search for based on their role
  const [searchRole, setSearchRole] = useState(""); // "", "TRAINER", "INSTITUTION", "ALL"
  
  // Default search role based on user's role
  useEffect(() => {
    if (user?.role === "TRAINER") {
      setSearchRole("INSTITUTION"); // Trainers see institutions by default
    } else if (user?.role === "INSTITUTION") {
      setSearchRole("TRAINER"); // Institutions see trainers by default
    } else {
      setSearchRole("ALL"); // Students see all
    }
  }, [user?.role]);

  const searchLabel = searchRole === "INSTITUTION" ? "Institutions" : 
                      searchRole === "TRAINER" ? "Trainers" : 
                      searchRole === "ALL" ? "All Professionals" : "Professionals";

  const [filters, setFilters] = useState({
    skill: "",
    location: "",
    search: "", // General search term
    minRating: "",
    minExperience: "",
    maxExperience: "",
    verified: false,
    sort: "rating_desc"
  });

  useEffect(() => {
    if (isOpen) {
      // Only load skills if searching for trainers
      if (searchRole === "TRAINER" || searchRole === "ALL") {
        loadSkills();
      }
      performSearch();
    }
  }, [isOpen, searchRole]); // Re-search when role changes

  const loadSkills = async () => {
    try {
      const response = await ApiService.request("/discovery/skills");
      setSkills(response.data || []);
    } catch (error) {
      console.error("Failed to load skills:", error);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      setResults([]); // Clear previous results
      
      let response;
      if (searchRole === "TRAINER") {
        response = await ApiService.searchTrainers(filters);
        console.log('Trainer search response:', response);
        setResults(response.data || []);
      } else if (searchRole === "INSTITUTION") {
        response = await ApiService.searchInstitutions(filters);
        console.log('Institution search response:', response);
        setResults(response.data || []); // Changed from response.institutions to response.data
      } else {
        // Search both trainers and institutions
        const [trainersRes, institutionsRes] = await Promise.all([
          ApiService.searchTrainers(filters),
          ApiService.searchInstitutions(filters)
        ]);
        console.log('Combined search response:', { trainersRes, institutionsRes });
        setResults([...(trainersRes.data || []), ...(institutionsRes.data || [])]); // Changed from institutionsRes.institutions
      }
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      skill: "",
      location: "",
      search: "",
      minRating: "",
      minExperience: "",
      maxExperience: "",
      verified: false,
      sort: "rating_desc"
    });
  };

  const sendConnectionRequest = async (userId) => {
    try {
      await ApiService.connectUser(userId);
      alert("Connection request sent!");
    } catch (error) {
      alert(error.message || "Failed to send connection request");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel - Professional LinkedIn Style */}
      <div className={`fixed inset-0 md:inset-y-0 md:right-0 w-full md:w-[600px] lg:w-[900px] ${theme.cardBg} shadow-2xl z-50 overflow-hidden flex flex-col border-l ${theme.cardBorder}`}>
        {/* Header */}
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${theme.cardBorder} flex items-center justify-between`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-base sm:text-lg font-semibold ${theme.textPrimary}`}>
                Discover {searchLabel}
              </h1>
              <p className={`text-xs ${theme.textMuted}`}>
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.hoverBg} transition`}
          >
            <X className={`w-5 h-5 ${theme.textSecondary}`} />
          </button>
        </div>

        {/* Role Selector Tabs */}
        {(user?.role === "TRAINER" || user?.role === "INSTITUTION") && (
          <div className={`px-4 sm:px-6 py-3 border-b ${theme.cardBorder} flex gap-2`}>
            <button
              onClick={() => setSearchRole(user?.role === "TRAINER" ? "INSTITUTION" : "TRAINER")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                searchRole === (user?.role === "TRAINER" ? "INSTITUTION" : "TRAINER")
                  ? `bg-blue-500 text-white shadow-md`
                  : `${theme.hoverBg} ${theme.textSecondary}`
              }`}
            >
              {user?.role === "TRAINER" ? "Institutions" : "Trainers"}
            </button>
            <button
              onClick={() => setSearchRole(user?.role === "TRAINER" ? "TRAINER" : "INSTITUTION")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                searchRole === (user?.role === "TRAINER" ? "TRAINER" : "INSTITUTION")
                  ? `bg-blue-500 text-white shadow-md`
                  : `${theme.hoverBg} ${theme.textSecondary}`
              }`}
            >
              {user?.role === "TRAINER" ? "Trainers" : "Institutions"}
            </button>
          </div>
        )}

        {/* Search & Filters Bar */}
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${theme.cardBorder} space-y-3`}>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
              <input
                type="text"
                placeholder={`Search ${searchLabel.toLowerCase()} by name, ID (e.g., ${searchRole === "TRAINER" ? "TRN0001" : searchRole === "INSTITUTION" ? "INST0001" : "TRN0001/INST0001"}), ${searchRole === "TRAINER" || searchRole === "ALL" ? "skills, " : ""}location...`}
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && performSearch()}
                className={`w-full pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base ${theme.inputBg} border ${theme.inputBorder} rounded-lg ${theme.inputText} ${theme.inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition`}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 sm:py-2.5 border ${theme.cardBorder} rounded-lg ${theme.hoverBg} flex items-center justify-center sm:justify-start gap-2 transition`}
            >
              <Filter className={`w-5 h-5 ${theme.textSecondary}`} />
              <span className={`text-sm font-medium ${theme.textPrimary}`}>Filters</span>
              <ChevronDown className={`w-4 h-4 ${theme.textMuted} transition ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={performSearch}
              className="w-full sm:w-auto px-6 py-2 sm:py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm shadow-lg transition"
            >
              Search
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className={`p-3 sm:p-4 ${theme.inputBg} rounded-lg border ${theme.cardBorder} space-y-3 sm:space-y-4`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {searchRole === "TRAINER" && (
                  <div>
                    <label className={`block text-xs font-semibold ${theme.textPrimary} mb-2`}>Skill</label>
                    <select
                      value={filters.skill}
                      onChange={(e) => handleFilterChange("skill", e.target.value)}
                      className={`w-full px-3 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-lg text-sm ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                    >
                      <option value="">All Skills</option>
                      {skills.map(skill => (
                        <option key={skill} value={skill}>{skill}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className={`block text-xs font-semibold ${theme.textPrimary} mb-2`}>Location</label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    placeholder="City or region"
                    className={`w-full px-3 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-lg text-sm ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold ${theme.textPrimary} mb-2`}>Minimum Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange("minRating", e.target.value)}
                    className={`w-full px-3 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-lg text-sm ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                  >
                    <option value="">Any Rating</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>

                {searchRole === "TRAINER" && (
                  <>
                    <div>
                      <label className={`block text-xs font-semibold ${theme.textPrimary} mb-2`}>Min Experience (years)</label>
                      <input
                        type="number"
                        value={filters.minExperience}
                        onChange={(e) => handleFilterChange("minExperience", e.target.value)}
                        placeholder="0"
                        min="0"
                        className={`w-full px-3 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-lg text-sm ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${theme.textPrimary} mb-2`}>Max Experience (years)</label>
                      <input
                        type="number"
                        value={filters.maxExperience}
                        onChange={(e) => handleFilterChange("maxExperience", e.target.value)}
                        placeholder="Any"
                        min="0"
                        className={`w-full px-3 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-lg text-sm ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className={`block text-xs font-semibold ${theme.textPrimary} mb-2`}>Sort By</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    className={`w-full px-3 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-lg text-sm ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                  >
                    <option value="rating_desc">Highest Rated</option>
                    {searchRole === "TRAINER" && <option value="experience_desc">Most Experience</option>}
                    <option value="newest">Recently Joined</option>
                  </select>
                </div>

                {searchRole === "TRAINER" && (
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.verified}
                        onChange={(e) => handleFilterChange("verified", e.target.checked)}
                        className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${theme.textPrimary}`}>Verified Only</span>
                    </label>
                  </div>
                )}

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className={`text-sm ${theme.textSecondary} hover:${theme.accentColor} font-medium transition`}
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className={`flex-1 overflow-y-auto ${theme.bg} p-4 sm:p-6`}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`${theme.cardBg} rounded-xl p-4 sm:p-6 border ${theme.cardBorder} animate-pulse`}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-300 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-300 rounded w-3/4" />
                      <div className="h-3 bg-gray-300 rounded w-1/2" />
                      <div className="h-3 bg-gray-300 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-8 sm:p-12 text-center`}>
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${theme.inputBg} flex items-center justify-center mx-auto mb-4`}>
                <Search className={`w-8 h-8 sm:w-10 sm:h-10 ${theme.textMuted}`} />
              </div>
              <h3 className={`text-base sm:text-lg font-semibold ${theme.textPrimary} mb-2`}>No results found</h3>
              <p className={`text-sm ${theme.textMuted}`}>Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {results.map(result => {
                // Determine if this is a trainer or institution
                const isTrainer = result.user && result.skills;
                const isInstitution = result.name;
                
                // Normalize data structure
                const displayName = isInstitution 
                  ? result.name 
                  : result.user 
                    ? `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim() || 'Unknown'
                    : 'Unknown';
                
                const profilePicture = result.user?.profilePicture;
                const uniqueId = result.uniqueId;
                const rating = result.rating || 0;
                const location = result.location;
                const isVerified = result.user?.isVerified || result.verified;
                const headline = result.user?.headline || (isTrainer ? 'Trainer' : 'Institution');
                const bio = result.bio;
                const skills = result.skills || [];
                const experience = result.experience;
                
                return (
                  <div key={result.id} className={`${theme.cardBg} rounded-xl p-4 sm:p-6 border ${theme.cardBorder} hover:shadow-lg transition group`}>
                    <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="relative">
                        {profilePicture ? (
                          <img 
                            src={profilePicture} 
                            alt={displayName}
                            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover shadow-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-base sm:text-lg md:text-xl font-bold shadow-lg">
                            {displayName && displayName !== 'Unknown' ? displayName[0].toUpperCase() : '?'}
                          </div>
                        )}
                        {isVerified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                            <Award className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-sm sm:text-base ${theme.textPrimary} truncate`}>
                            {displayName}
                          </h3>
                          {isVerified && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" title="Verified" />
                          )}
                          {uniqueId && (
                            <span className={`text-xs ${theme.textMuted} font-mono px-2 py-0.5 rounded border ${theme.cardBorder}`}>
                              {uniqueId}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs sm:text-sm ${theme.textSecondary} truncate mb-2`}>
                          {headline}
                        </p>
                        
                        <div className="flex items-center gap-3 flex-wrap">
                          {rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className={`text-sm font-semibold ${theme.textPrimary}`}>
                                {rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                          
                          {location && (
                            <div className="flex items-center gap-1">
                              <MapPin className={`w-4 h-4 ${theme.textMuted}`} />
                              <span className={`text-xs ${theme.textSecondary}`}>
                                {location}
                              </span>
                            </div>
                          )}

                          {experience !== undefined && (
                            <div className="flex items-center gap-1">
                              <Briefcase className={`w-4 h-4 ${theme.textMuted}`} />
                              <span className={`text-xs ${theme.textSecondary}`}>
                                {experience}y exp
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {bio && (
                      <p className={`text-sm ${theme.textSecondary} mb-3 line-clamp-2`}>
                        {bio}
                      </p>
                    )}

                    {skills && skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {skills.slice(0, 4).map(skill => (
                          <span key={skill} className={`px-3 py-1 ${theme.inputBg} ${theme.textSecondary} text-xs rounded-full font-medium border ${theme.cardBorder}`}>
                            {skill}
                          </span>
                        ))}
                        {skills.length > 4 && (
                          <span className={`px-3 py-1 ${theme.inputBg} ${theme.textMuted} text-xs rounded-full font-medium`}>
                            +{skills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        // Determine the correct route based on user type
                        const username = result.user?.username || result.user?.id;
                        if (username) {
                          let profileRoute;
                          if (isTrainer) {
                            profileRoute = `/trainer/profile/${username}`;
                          } else if (isInstitution) {
                            profileRoute = `/institute/profile/${username}`;
                          } else {
                            profileRoute = `/profile/${username}`;
                          }
                          navigate(profileRoute);
                          onClose();
                        }
                      }}
                      className="w-full py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 font-medium text-sm shadow-lg transition group-hover:shadow-xl"
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DiscoveryPanel;
