import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { X, Camera, Upload, User, Briefcase, MapPin, GraduationCap, Building2 } from "lucide-react";
import ApiService from "../../services/api";
import { DEFAULT_PROFILE_IMAGE } from "../../utils/constants";

export default function EditProfileModal({ isOpen, onClose, userType, profileData, onSave }) {
  const { theme } = useTheme();
  
  // Helper function to get the display name
  const getDisplayName = () => {
    if (!profileData) return "";
    return profileData.firstName
      ? `${profileData.firstName} ${profileData.lastName || ""}`.trim()
      : profileData.name || "";
  };

  const [formData, setFormData] = useState({
    name: getDisplayName(),
    headline: profileData?.headline || "",
    location: profileData?.location || "",
    about: profileData?.bio || "",
    skills: profileData?.trainerProfile?.skills || profileData?.skills || [],
    experience: profileData?.experience || [],
    avatar: profileData?.profilePicture || profileData?.avatar || DEFAULT_PROFILE_IMAGE,
    coverImage: profileData?.coverImage || ""
  });
  
  const [profilePreview, setProfilePreview] = useState(profileData?.profilePicture || profileData?.avatar || DEFAULT_PROFILE_IMAGE);
  const [coverPreview, setCoverPreview] = useState(profileData?.coverImage || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Update form data when profileData changes or modal opens
  useEffect(() => {
    if (profileData && isOpen) {
      const displayName = profileData.firstName
        ? `${profileData.firstName} ${profileData.lastName || ""}`.trim()
        : profileData.name || "";
        
      setFormData({
        name: displayName,
        headline: profileData.headline || "",
        location: profileData.location || "",
        about: profileData.bio || "",
        skills: profileData.trainerProfile?.skills || profileData.skills || [],
        experience: profileData.experience || [],
        avatar: profileData.profilePicture || profileData.avatar || DEFAULT_PROFILE_IMAGE,
        coverImage: profileData.coverImage || ""
      });
      setProfilePreview(profileData.profilePicture || profileData.avatar || DEFAULT_PROFILE_IMAGE);
      setCoverPreview(profileData.coverImage || null);
      
      // Reset file states when modal opens
      setProfileFile(null);
      setCoverFile(null);
      setError(null);
    }
  }, [profileData, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleExperienceChange = (index, field, value) => {
    const updatedExperience = [...(formData.experience || [])];
    if (!updatedExperience[index]) {
      updatedExperience[index] = {};
    }
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    setFormData((prev) => ({ ...prev, experience: updatedExperience }));
    setError(null);
  };

  const handleSkillsChange = (value) => {
    // Split by both comma and space, then filter out empty strings
    const skillsArray = value
      .split(/[,\s]+/) // Split by comma or space (one or more)
      .map((s) => s.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, skills: skillsArray }));
    setError(null);
  };

  const handleSkillsKeyDown = (e) => {
    // Handle Enter, comma, or space to add skill
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value && !formData.skills?.includes(value)) {
        // Append to existing skills instead of replacing
        setFormData((prev) => ({
          ...prev,
          skills: [...(prev.skills || []), value]
        }));
        setError(null);
        // Clear the input after adding
        e.target.value = '';
      }
    }
  };

  const removeSkill = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "profile") {
          setProfilePreview(reader.result);
          setProfileFile(file);
        } else {
          setCoverPreview(reader.result);
          setCoverFile(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    
    try {
      console.log('Uploading file:', file.name, 'Size:', file.size);
      const response = await ApiService.uploadFile(file, "Profile Photo");
      console.log('Upload response:', response);
      
      if (response.success) {
        console.log('Upload successful, URL:', response.data.url);
        return response.data.url;
      } else {
        console.error('Upload failed:', response.message);
        throw new Error(response.message || "Failed to upload file");
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name?.trim()) {
        setError("Name is required");
        setLoading(false);
        return;
      }

      // Upload photos first if changed
      let profilePictureUrl = formData.avatar;
      let coverImageUrl = formData.coverImage;

      console.log('Starting save - profileFile:', profileFile, 'coverFile:', coverFile);
      console.log('Initial profilePictureUrl:', profilePictureUrl);
      console.log('Initial coverImageUrl:', coverImageUrl);

      if (profileFile) {
        console.log('Uploading profile picture...');
        profilePictureUrl = await uploadFile(profileFile);
        console.log('Profile picture uploaded, URL:', profilePictureUrl);
      }
      if (coverFile) {
        console.log('Uploading cover image...');
        coverImageUrl = await uploadFile(coverFile);
        console.log('Cover image uploaded, URL:', coverImageUrl);
      }

      // Split name for backend
      let firstName = formData.name.trim();
      let lastName = "";

      if (!isInstitute && formData.name.includes(" ")) {
        const parts = formData.name.trim().split(" ");
        firstName = parts[0];
        lastName = parts.slice(1).join(" ");
      }

      console.log('Saving headline:', formData.headline); // Debug log
      console.log('Current profileData headline:', profileData?.headline); // Debug log

      // Prepare the update data with proper field mapping
      const updateData = {
        firstName,
        lastName,
        headline: formData.headline,
        location: formData.location,
        bio: formData.about,
        profilePicture: profilePictureUrl,
        coverImage: coverImageUrl,
        skills: formData.skills || [],
        experience: formData.experience || []
      };

      console.log('Sending update data:', updateData); // Debug log

      // Use the general profile endpoint for all user types for consistency
      const response = await ApiService.updateGeneralProfile(updateData);

      console.log('Update response:', response); // Debug log

      if (response.success) {
        // The general endpoint returns the complete user object with all relations
        const updatedData = {
          ...response.data,
          // Ensure the updated fields are properly included for immediate UI update
          firstName,
          lastName,
          headline: formData.headline,
          location: formData.location,
          bio: formData.about,
          profilePicture: profilePictureUrl,
          avatar: profilePictureUrl,
          coverImage: coverImageUrl,
          skills: formData.skills,
          experience: formData.experience
        };
        
        console.log('Updated data being sent to onSave:', updatedData); // Debug log
        onSave(updatedData);
        onClose();
      } else {
        setError(response.message || "Failed to save profile");
      }

    } catch (err) {
      console.error("Profile save error:", err);
      
      // Handle specific user not found error
      if (err.message && err.message.includes("User account not found")) {
        setError("Your session has expired. Please log out and create a new account.");
      } else if (err.message && err.message.includes("Network")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.message || "Failed to save profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isStudent = userType === "student";
  const isTrainer = userType === "trainer";
  const isInstitute = userType === "institute";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${theme.cardBorder} ${theme.cardBg} transition-all duration-300`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b ${theme.divider} ${theme.cardBg}`}
        >
          <h2 className={`text-lg sm:text-xl font-bold ${theme.textPrimary}`}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className={`p-1.5 sm:p-2 rounded-full ${theme.hoverBg} ${theme.hoverText} transition-all duration-300`}
          >
            <X size={20} className="sm:w-[24px] sm:h-[24px]" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Photo Upload Section */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className={`text-base sm:text-lg font-semibold ${theme.textPrimary}`}>
              Photos
            </h3>

            {/* Cover Photo Upload */}
            <div className="relative">
              <label className={`block text-xs sm:text-sm font-medium ${theme.textSecondary} mb-2`}>
                Cover Photo
              </label>
              <div
                className={`relative h-24 sm:h-40 rounded-xl overflow-hidden border-2 border-dashed ${theme.cardBorder} ${theme.hoverBg} transition-all duration-300 cursor-pointer group`}
                onClick={() => coverInputRef.current?.click()}
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Upload className={`w-6 sm:w-8 h-6 sm:h-8 ${theme.textMuted} mb-1 sm:mb-2`} />
                    <span className={`text-xs sm:text-sm ${theme.textMuted}`}>
                      Click to upload cover photo
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera className="text-white w-6 sm:w-8 h-6 sm:h-8" />
                </div>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "cover")}
                className="hidden"
              />
            </div>

            {/* Profile Photo Upload */}
            <div className="flex items-center gap-3 sm:gap-4">
              <label className={`block text-xs sm:text-sm font-medium ${theme.textSecondary}`}>
                Profile Photo
              </label>
              <div
                className="relative cursor-pointer group"
                onClick={() => profileInputRef.current?.click()}
              >
                <div
                  className={`w-16 sm:w-24 h-16 sm:h-24 rounded-full overflow-hidden border-4 ${theme.cardBorder} ${theme.cardBg} shadow-lg`}
                >
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex items-center justify-center w-full h-full ${theme.inputBg}`}
                    >
                      <User className={`w-8 sm:w-10 h-8 sm:h-10 ${theme.textMuted}`} />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera className="text-white w-5 sm:w-6 h-5 sm:h-6" />
                </div>
              </div>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "profile")}
                className="hidden"
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className={`text-base sm:text-lg font-semibold ${theme.textPrimary}`}>
              Basic Info
            </h3>

            {/* Name */}
            <div>
              <label
                className={`block text-xs sm:text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                {isInstitute ? "Institute Name" : "Full Name"}
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-400 focus:outline-none transition-all duration-300 text-xs sm:text-base`}
                placeholder={isInstitute ? "Institute name" : "Your full name"}
              />
            </div>

            {/* Headline */}
            <div>
              <label
                className={`block text-xs sm:text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Headline
              </label>
              <input
                type="text"
                value={formData.headline || ""}
                onChange={(e) => handleInputChange("headline", e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-400 focus:outline-none transition-all duration-300 text-xs sm:text-base`}
                placeholder="Professional headline"
              />
            </div>

            {/* Location */}
            <div>
              <label
                className={`block text-xs sm:text-sm font-medium ${theme.textSecondary} mb-2 flex items-center gap-2`}
              >
                <MapPin size={14} className="sm:w-[16px] sm:h-[16px]" />
                Location
              </label>
              <input
                type="text"
                value={formData.location || ""}
                onChange={(e) => handleInputChange("location", e.target.value)}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-400 focus:outline-none transition-all duration-300 text-xs sm:text-base`}
                placeholder="City, Country"
              />
            </div>

            {/* Role specific fields */}
            {isStudent && (
              <div>
                <label
                  className={`block text-xs sm:text-sm font-medium ${theme.textSecondary} mb-2 flex items-center gap-2`}
                >
                  <GraduationCap size={14} className="sm:w-[16px] sm:h-[16px]" />
                  Education
                </label>
                <input
                  type="text"
                  value={formData.education?.[0]?.school || ""}
                  onChange={(e) =>
                    handleInputChange("education", [
                      { ...formData.education?.[0], school: e.target.value },
                    ])
                  }
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-400 focus:outline-none transition-all duration-300 text-xs sm:text-base`}
                  placeholder="University name"
                />
              </div>
            )}

            {isTrainer && (
              <div>
                <label
                  className={`block text-xs sm:text-sm font-medium ${theme.textSecondary} mb-2 flex items-center gap-2`}
                >
                  <Briefcase size={14} className="sm:w-[16px] sm:h-[16px]" />
                  Current Position
                </label>
                <input
                  type="text"
                  value={formData.experience?.[0]?.title || ""}
                  onChange={(e) => handleExperienceChange(0, "title", e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-400 focus:outline-none transition-all duration-300 text-xs sm:text-base`}
                  placeholder="Job title"
                />
                <input
                  type="text"
                  value={formData.experience?.[0]?.company || ""}
                  onChange={(e) => handleExperienceChange(0, "company", e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-400 focus:outline-none transition-all duration-300 text-xs sm:text-base mt-2`}
                  placeholder="Company name"
                />
              </div>
            )}

            {isInstitute && (
              <>
                <div>
                  <label
                    className={`block text-xs sm:text-sm font-medium ${theme.textSecondary} mb-2`}
                  >
                    Founded Year
                  </label>
                  <input
                    type="text"
                    value={formData.founded || ""}
                    onChange={(e) => handleInputChange("founded", e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-400 focus:outline-none transition-all duration-300 text-xs sm:text-base`}
                    placeholder="Year founded"
                  />
                </div>
                <div>
                  <label
                    className={`block text-xs sm:text-sm font-medium ${theme.textSecondary} mb-2`}
                  >
                    Website
                  </label>
                  <input
                    type="text"
                    value={formData.website || ""}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-400 focus:outline-none transition-all duration-300 text-xs sm:text-base`}
                    placeholder="www.example.com"
                  />
                </div>
              </>
            )}

            {/* Skills */}
            <div>
              <label
                className={`block text-xs sm:text-sm font-medium ${theme.textSecondary} mb-2`}
              >
                Skills (press Space, Comma, or Enter to add)
              </label>
              
              {/* Skills Display */}
              {formData.skills && formData.skills.length > 0 && (
                <div className={`flex flex-wrap gap-2 mb-3 p-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg}`}>
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm ${theme.accentBg}/20 ${theme.accentColor} border ${theme.cardBorder} font-medium transition-all duration-200 hover:${theme.accentBg}/30`}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="ml-1 hover:text-red-500 transition-colors"
                        title="Remove skill"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Skills Input */}
              <input
                type="text"
                onKeyDown={handleSkillsKeyDown}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value && !formData.skills?.includes(value)) {
                    // Append to existing skills
                    setFormData((prev) => ({
                      ...prev,
                      skills: [...(prev.skills || []), value]
                    }));
                    e.target.value = '';
                  }
                }}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-400 focus:outline-none transition-all duration-300 text-xs sm:text-base`}
                placeholder="Type a skill and press Space, Comma, or Enter"
              />
              <p className={`text-xs ${theme.textMuted} mt-1.5`}>
                Add skills by pressing Space, Comma (,), or Enter after each skill
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`sticky bottom-0 z-10 flex flex-col gap-2 sm:gap-3 p-4 sm:p-6 border-t ${theme.divider} ${theme.cardBg}`}
        >
          {error && (
            <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-xs sm:text-sm">
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-base ${theme.textSecondary} ${theme.hoverBg} transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-base bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              {loading ? (
                <>
                  <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
