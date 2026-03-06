import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Search, Filter, Star, MapPin, Briefcase, Award, ChevronDown } from 'lucide-react';

export default function TrainerSearch() {
  const { theme } = useTheme();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    location: '',
    skills: '',
    minRating: 0,
    minExperience: 0,
    verified: false,
    page: 1,
    limit: 12
  });
  const [showFilters, setShowFilters] = useState(false);
  const [popularSkills, setPopularSkills] = useState([]);
  const [popularLocations, setPopularLocations] = useState([]);

  useEffect(() => {
    searchTrainers();
    loadPopularData();
  }, [filters]);

  const searchTrainers = async () => {
    setLoading(true);
    try {
      const response = await ApiService.searchTrainers(filters);
      if (response.success) {
        // Backend returns data (array) and meta (pagination)
        setTrainers(response.data || []);
        setPagination(response.meta || null);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPopularData = async () => {
    try {
      const [skillsResponse, locationsResponse] = await Promise.all([
        ApiService.getPopularSkills(10),
        ApiService.getPopularLocations(10)
      ]);
      
      if (skillsResponse.success) {
        setPopularSkills(skillsResponse.data);
      }
      if (locationsResponse.success) {
        setPopularLocations(locationsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load popular data:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleSkillClick = (skill) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.split(',').filter(s => s.trim() !== skill).join(',')
        : [...(prev.skills ? prev.skills.split(',').map(s => s.trim()) : []), skill].join(','),
      page: 1
    }));
  };

  const handleLocationClick = (location) => {
    setFilters(prev => ({
      ...prev,
      location: location,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      skills: '',
      minRating: 0,
      minExperience: 0,
      verified: false,
      page: 1,
      limit: 12
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>
          Find Expert Trainers
        </h1>
        <p className={`${theme.textSecondary}`}>
          Discover and connect with top-rated trainers in your field
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
            <input
              type="text"
              placeholder="Search by skills, location, or name..."
              value={filters.skills}
              onChange={(e) => handleFilterChange('skills', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg} transition-colors flex items-center gap-2`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                Location
              </label>
              <input
                type="text"
                placeholder="City or country"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                Minimum Rating
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="0">All Ratings</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                Minimum Experience
              </label>
              <select
                value={filters.minExperience}
                onChange={(e) => handleFilterChange('minExperience', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="0">Any Experience</option>
                <option value="1">1+ Years</option>
                <option value="3">3+ Years</option>
                <option value="5">5+ Years</option>
                <option value="10">10+ Years</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => handleFilterChange('verified', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className={`text-sm ${theme.textSecondary}`}>Verified Only</span>
              </label>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className={`px-4 py-2 text-sm ${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Popular Skills & Locations */}
      <div className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className={`text-sm font-semibold ${theme.textSecondary} mb-3`}>Popular Skills</h3>
            <div className="flex flex-wrap gap-2">
              {popularSkills.map((skill, index) => (
                <button
                  key={index}
                  onClick={() => handleSkillClick(skill.skill)}
                  className={`px-3 py-1 rounded-full text-sm border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg} transition-colors`}
                >
                  {skill.skill} ({skill.count})
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className={`text-sm font-semibold ${theme.textSecondary} mb-3`}>Popular Locations</h3>
            <div className="flex flex-wrap gap-2">
              {popularLocations.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationClick(location.location)}
                  className={`px-3 py-1 rounded-full text-sm border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg} transition-colors`}
                >
                  {location.location} ({location.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className={`mt-4 ${theme.textMuted}`}>Searching trainers...</p>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <p className={`${theme.textMuted}`}>
              {pagination ? `${pagination.total} trainers found` : 'No trainers found'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers.map((trainer) => (
              <TrainerCard key={trainer.id} trainer={trainer} />
            ))}
          </div>
          
          {/* No Results */}
          {!loading && trainers.length === 0 && (
            <div className="text-center py-12">
              <p className={`${theme.textMuted}`}>No trainers found matching your criteria.</p>
            </div>
          )}
          
          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex gap-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg border ${theme.inputBorder} ${
                      page === pagination.page
                        ? `${theme.accentBg} text-white`
                        : `${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg}`
                    } transition-colors`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TrainerCard({ trainer }) {
  const { theme } = useTheme();
  
  return (
    <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} overflow-hidden hover:shadow-lg transition-shadow`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {trainer.user?.email?.charAt(0).toUpperCase() || 'T'}
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${theme.textPrimary}`}>
                {trainer.user?.email?.split('@')[0] || 'Trainer'}
              </h3>
              {trainer.verified && (
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className={`text-xs ${theme.textMuted}`}>Verified</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className={`font-semibold ${theme.textPrimary}`}>
                {trainer.reputationScore?.toFixed(1) || '0.0'}
              </span>
            </div>
            <p className={`text-xs ${theme.textMuted}`}>
              {trainer._count?.requests || 0} completed
            </p>
          </div>
        </div>
        
        {/* Bio */}
        {trainer.bio && (
          <p className={`${theme.textSecondary} text-sm mb-4 line-clamp-2`}>
            {trainer.bio}
          </p>
        )}
        
        {/* Location & Experience */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          {trainer.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className={theme.textMuted}>{trainer.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Briefcase className="w-4 h-4 text-gray-500" />
            <span className={theme.textMuted}>{trainer.experience} years</span>
          </div>
        </div>
        
        {/* Skills */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {trainer.skills?.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded-full text-xs border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary}`}
              >
                {skill}
              </span>
            ))}
            {trainer.skills?.length > 3 && (
              <span className={`px-2 py-1 rounded-full text-xs ${theme.textMuted}`}>
                +{trainer.skills.length - 3} more
              </span>
            )}
          </div>
        </div>
        
        {/* Badges */}
        {trainer.badges && trainer.badges.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {trainer.badges.slice(0, 2).map((badge, index) => (
                <div
                  key={index}
                  className={`px-2 py-1 rounded-full text-xs border ${theme.inputBorder} ${theme.cardBg} flex items-center gap-1`}
                  title={badge.criteria}
                >
                  <span>{badge.icon}</span>
                  <span className={theme.textSecondary}>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div>
            <p className={`text-lg font-bold ${theme.textPrimary}`}>
              {trainer.completionRate?.toFixed(0) || 0}%
            </p>
            <p className={`text-xs ${theme.textMuted}`}>Completion</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${theme.textPrimary}`}>
              {trainer.responseTime || 0}h
            </p>
            <p className={`text-xs ${theme.textMuted}`}>Response</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${theme.textPrimary}`}>
              {trainer._count?.materials || 0}
            </p>
            <p className={`text-xs ${theme.textMuted}`}>Materials</p>
          </div>
        </div>
        
        {/* Action Button */}
        <button className={`w-full py-2 rounded-lg ${theme.accentBg} text-white font-medium hover:opacity-90 transition-opacity`}>
          View Profile
        </button>
      </div>
    </div>
  );
}
