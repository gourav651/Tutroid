import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { 
  X, Camera, Upload, User, Briefcase, MapPin, GraduationCap, 
  Building2, Pencil, Plus, Trash2, Award, Link as LinkIcon 
} from "lucide-react";
import ApiService from "../../services/api";
import SavingIndicator from "../../components/SavingIndicator";

function EditProfileModalLinkedIn({ isOpen, onClose, userType, profileData, onSave, initialSection = null }) {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState(initialSection); // null = main view, 'intro', 'about', 'experience', etc.
  const [formData, setFormData] = useState(profileData);
  const [profilePreview, setProfilePreview] = useState(profileData.avatar || null);
  const [coverPreview, setCoverPreview] = useState(profileData.coverImage || null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [education, setEducation] = useState(profileData.education || []);
  const [experience, setExperience] = useState(profileData.experience || []);
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Set initial section when modal opens and reset form data
  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection);
      const initialFormData = {
        ...profileData,
        name: profileData.firstName 
          ? `${profileData.firstName} ${profileData.lastName || ""}`.trim()
          : profileData.name || "",
        skills: profileData.trainerProfile?.skills || profileData.skills || []
      };
      setFormData(initialFormData);
      setEducation(profileData.education || []);
      setExperience(profileData.experience || []);
      setProfilePreview(profileData.avatar || profileData.profilePicture || null);
      setCoverPreview(profileData.coverImage || null);
      setError(null);
      console.log('Modal opened with skills:', initialFormData.skills); // Debug log
      console.log('Modal opened with education:', profileData.education); // Debug log
    }
  }, [isOpen, initialSection, profileData]);

  if (!isOpen) return null;

  const isStudent = userType === "student";
  const isTrainer = userType === "trainer";
  const isInstitute = userType === "institute";

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const addEducation = () => {
    setEducation([...education, { school: "", degree: "", field: "", startYear: "", endYear: "", description: "" }]);
  };

  const updateEducation = (index, field, value) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    setExperience([...experience, { title: "", company: "", location: "", startYear: "", endYear: "", isCurrent: false, description: "" }]);
  };

  const updateExperience = (index, field, value) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const removeExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
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
    
    const response = await ApiService.uploadFile(file, "Profile Photo");
    if (response.success) {
      return response.data.url;
    }
    throw new Error(response.message || "Failed to upload file");
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Upload photos first if changed
      let profilePictureUrl = formData.avatar;
      let coverImageUrl = formData.coverImage;

      if (profileFile) {
        profilePictureUrl = await uploadFile(profileFile);
      }
      if (coverFile) {
        coverImageUrl = await uploadFile(coverFile);
      }

      // Split name for backend
      let firstName = formData.name;
      let lastName = "";

      if (!isInstitute && formData.name.includes(" ")) {
        const parts = formData.name.split(" ");
        firstName = parts[0];
        lastName = parts.slice(1).join(" ");
      }

      // Call API to save profile
      const updateData = {
        ...formData,
        firstName,
        lastName,
        profilePicture: profilePictureUrl,
        coverImage: coverImageUrl,
        avatar: profilePictureUrl,
        education: education.filter(edu => edu.school || edu.degree), // Only save non-empty education entries
        experience: experience.filter(exp => exp.title || exp.company), // Only save non-empty experience entries
        skills: formData.skills || [], // Ensure skills is always an array
      };

      // For trainers, also include skills in trainerProfile
      if (isTrainer && formData.skills) {
        updateData.trainerProfile = {
          ...updateData.trainerProfile,
          skills: formData.skills
        };
      }

      console.log('Saving profile data:', updateData); // Debug log
      console.log('User type:', userType, 'isTrainer:', isTrainer); // Debug log
      console.log('Skills being saved:', updateData.skills); // Debug log

      const response = isTrainer 
        ? await ApiService.updateTrainerProfile(updateData)
        : await ApiService.updateGeneralProfile(updateData);

      console.log('API Response:', response); // Debug log

      if (response.success) {
        console.log('Save successful, API response:', response.data); // Debug log
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          // Pass the complete updated data including local changes
          const completeUpdatedData = {
            ...response.data,
            ...updateData, // Include all the data we just saved
            education: education.filter(edu => edu.school || edu.degree),
            experience: experience.filter(exp => exp.title || exp.company),
            skills: formData.skills || [],
            // Ensure trainerProfile skills are included for trainers
            trainerProfile: isTrainer ? {
              ...response.data.trainerProfile,
              skills: formData.skills || []
            } : response.data.trainerProfile
          };
          console.log('Passing complete data to onSave:', completeUpdatedData); // Debug log
          onSave(completeUpdatedData);
          onClose();
        }, 1500);
      } else {
        console.log('Save failed:', response); // Debug log
        setError(response.message || "Failed to save profile");
      }

    } catch (err) {
      setError(err.message || "Failed to save profile. Please try again.");
      console.error("Profile save error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Main view with all sections
  const renderMainView = () => (
    <div className="space-y-3">
      {/* Intro Section */}
      <div 
        className={`${theme.cardBg} border ${theme.cardBorder} rounded-xl p-4 hover:shadow-md transition-all cursor-pointer`}
        onClick={() => setActiveSection('intro')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${theme.accentBg}/10 flex items-center justify-center`}>
              <User className={`w-5 h-5 ${theme.accentColor}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${theme.textPrimary}`}>Intro</h3>
              <p className={`text-sm ${theme.textMuted}`}>Name, headline, location</p>
            </div>
          </div>
          <Pencil className={`w-5 h-5 ${theme.textMuted}`} />
        </div>
      </div>

      {/* Photos Section */}
      <div 
        className={`${theme.cardBg} border ${theme.cardBorder} rounded-xl p-4 hover:shadow-md transition-all cursor-pointer`}
        onClick={() => setActiveSection('photos')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${theme.accentBg}/10 flex items-center justify-center`}>
              <Camera className={`w-5 h-5 ${theme.accentColor}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${theme.textPrimary}`}>Photos</h3>
              <p className={`text-sm ${theme.textMuted}`}>Profile & cover photo</p>
            </div>
          </div>
          <Pencil className={`w-5 h-5 ${theme.textMuted}`} />
        </div>
      </div>

      {/* About Section */}
      <div 
        className={`${theme.cardBg} border ${theme.cardBorder} rounded-xl p-4 hover:shadow-md transition-all cursor-pointer`}
        onClick={() => setActiveSection('about')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${theme.accentBg}/10 flex items-center justify-center`}>
              <Briefcase className={`w-5 h-5 ${theme.accentColor}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${theme.textPrimary}`}>About</h3>
              <p className={`text-sm ${theme.textMuted}`}>Tell your story</p>
            </div>
          </div>
          <Pencil className={`w-5 h-5 ${theme.textMuted}`} />
        </div>
      </div>

      {/* Skills Section */}
      <div 
        className={`${theme.cardBg} border ${theme.cardBorder} rounded-xl p-4 hover:shadow-md transition-all cursor-pointer`}
        onClick={() => setActiveSection('skills')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${theme.accentBg}/10 flex items-center justify-center`}>
              <Award className={`w-5 h-5 ${theme.accentColor}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${theme.textPrimary}`}>Skills</h3>
              <p className={`text-sm ${theme.textMuted}`}>Your expertise</p>
            </div>
          </div>
          <Pencil className={`w-5 h-5 ${theme.textMuted}`} />
        </div>
      </div>

      {/* Experience Section */}
      <div 
        className={`${theme.cardBg} border ${theme.cardBorder} rounded-xl p-4 hover:shadow-md transition-all cursor-pointer`}
        onClick={() => setActiveSection('experience')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${theme.accentBg}/10 flex items-center justify-center`}>
              <Briefcase className={`w-5 h-5 ${theme.accentColor}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${theme.textPrimary}`}>Experience</h3>
              <p className={`text-sm ${theme.textMuted}`}>Your work history</p>
            </div>
          </div>
          <Pencil className={`w-5 h-5 ${theme.textMuted}`} />
        </div>
      </div>

      {/* Education Section */}
      <div 
        className={`${theme.cardBg} border ${theme.cardBorder} rounded-xl p-4 hover:shadow-md transition-all cursor-pointer`}
        onClick={() => setActiveSection('education')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${theme.accentBg}/10 flex items-center justify-center`}>
              <GraduationCap className={`w-5 h-5 ${theme.accentColor}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${theme.textPrimary}`}>Education</h3>
              <p className={`text-sm ${theme.textMuted}`}>Your academic background</p>
            </div>
          </div>
          <Pencil className={`w-5 h-5 ${theme.textMuted}`} />
        </div>
      </div>
    </div>
  );

  // Intro section edit
  const renderIntroSection = () => (
    <div className="space-y-4">
      <div>
        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
          {isInstitute ? "Institute Name" : "Full Name"} *
        </label>
        <input
          type="text"
          value={formData.name || ""}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all`}
          placeholder={isInstitute ? "Institute name" : "Your full name"}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
          Headline *
        </label>
        <input
          type="text"
          value={formData.headline || ""}
          onChange={(e) => handleInputChange("headline", e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all`}
          placeholder="Professional headline"
        />
      </div>

      <div>
        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2 flex items-center gap-2`}>
          <MapPin size={16} />
          Location
        </label>
        <input
          type="text"
          value={formData.location || ""}
          onChange={(e) => handleInputChange("location", e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all`}
          placeholder="City, Country"
        />
      </div>
    </div>
  );

  // Photos section edit
  const renderPhotosSection = () => (
    <div className="space-y-6">
      {/* Cover Photo */}
      <div>
        <label className={`block text-sm font-medium ${theme.textSecondary} mb-3`}>
          Cover Photo
        </label>
        <div
          className={`relative h-40 rounded-xl overflow-hidden border-2 border-dashed ${theme.cardBorder} ${theme.hoverBg} transition-all cursor-pointer group`}
          onClick={() => coverInputRef.current?.click()}
        >
          {coverPreview ? (
            <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Upload className={`w-8 h-8 ${theme.textMuted} mb-2`} />
              <span className={`text-sm ${theme.textMuted}`}>Click to upload cover photo</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="text-white w-8 h-8" />
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

      {/* Profile Photo */}
      <div>
        <label className={`block text-sm font-medium ${theme.textSecondary} mb-3`}>
          Profile Photo
        </label>
        <div className="flex items-center gap-4">
          <div
            className="relative cursor-pointer group"
            onClick={() => profileInputRef.current?.click()}
          >
            <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${theme.cardBorder} ${theme.cardBg} shadow-lg`}>
              {profilePreview ? (
                <img src={profilePreview} alt="Profile preview" className="w-full h-full object-cover" />
              ) : (
                <div className={`flex items-center justify-center w-full h-full ${theme.inputBg}`}>
                  <User className={`w-10 h-10 ${theme.textMuted}`} />
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-6 h-6" />
            </div>
          </div>
          <div>
            <button
              onClick={() => profileInputRef.current?.click()}
              className={`px-4 py-2 rounded-lg border ${theme.cardBorder} ${theme.textPrimary} ${theme.hoverBg} transition-all text-sm font-medium`}
            >
              Change photo
            </button>
            <p className={`text-xs ${theme.textMuted} mt-2`}>JPG, PNG. Max 5MB</p>
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
  );

  // About section edit
  const renderAboutSection = () => (
    <div className="space-y-4">
      <div>
        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
          About
        </label>
        <textarea
          value={formData.about || ""}
          onChange={(e) => handleInputChange("about", e.target.value)}
          rows={6}
          className={`w-full px-4 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all resize-none`}
          placeholder="Tell us about yourself, your experience, and what makes you unique..."
        />
        <p className={`text-xs ${theme.textMuted} mt-2`}>
          {formData.about?.length || 0} / 2000 characters
        </p>
      </div>
    </div>
  );

  // Experience section edit
  const renderExperienceSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className={`block text-sm font-medium ${theme.textSecondary}`}>
          Experience
        </label>
        <button
          onClick={addExperience}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme.accentBg} text-white hover:opacity-90 transition-all text-sm`}
        >
          <Plus size={16} />
          Add Experience
        </button>
      </div>

      {experience.length === 0 ? (
        <div className={`text-center py-8 ${theme.textMuted}`}>
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No experience added yet</p>
          <p className="text-sm mt-1">Click "Add Experience" to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experience.map((exp, index) => (
            <div key={index} className={`p-4 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
              <div className="flex items-start justify-between mb-3">
                <h4 className={`font-medium ${theme.textPrimary}`}>Experience {index + 1}</h4>
                <button
                  onClick={() => removeExperience(index)}
                  className={`p-1 rounded-full ${theme.hoverBg} text-red-500 hover:bg-red-500/10 transition-all`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => updateExperience(index, "title", e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all text-sm`}
                    placeholder="Software Engineer"
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                    Company *
                  </label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all text-sm`}
                    placeholder="Google Inc."
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={exp.location}
                    onChange={(e) => updateExperience(index, "location", e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all text-sm`}
                    placeholder="San Francisco, CA"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                      Start Year
                    </label>
                    <input
                      type="number"
                      value={exp.startYear}
                      onChange={(e) => updateExperience(index, "startYear", e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all text-sm`}
                      placeholder="2020"
                      min="1950"
                      max="2030"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                      End Year
                    </label>
                    <input
                      type="number"
                      value={exp.endYear}
                      onChange={(e) => updateExperience(index, "endYear", e.target.value)}
                      disabled={exp.isCurrent}
                      className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all text-sm ${exp.isCurrent ? 'opacity-50' : ''}`}
                      placeholder="2024"
                      min="1950"
                      max="2030"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <label className={`flex items-center gap-2 text-xs font-medium ${theme.textMuted} mb-2`}>
                  <input
                    type="checkbox"
                    checked={exp.isCurrent}
                    onChange={(e) => {
                      updateExperience(index, "isCurrent", e.target.checked);
                      if (e.target.checked) {
                        updateExperience(index, "endYear", "");
                      }
                    }}
                    className="rounded"
                  />
                  I currently work here
                </label>
              </div>
              
              <div className="mt-3">
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                  Description (Optional)
                </label>
                <textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(index, "description", e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all resize-none text-sm`}
                  placeholder="Key responsibilities and achievements..."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Education section edit
  const renderEducationSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className={`block text-sm font-medium ${theme.textSecondary}`}>
          Education
        </label>
        <button
          onClick={addEducation}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme.accentBg} text-white hover:opacity-90 transition-all text-sm`}
        >
          <Plus size={16} />
          Add Education
        </button>
      </div>

      {education.length === 0 ? (
        <div className={`text-center py-8 ${theme.textMuted}`}>
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No education added yet</p>
          <p className="text-sm mt-1">Click "Add Education" to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {education.map((edu, index) => (
            <div key={index} className={`p-4 rounded-xl border ${theme.cardBorder} ${theme.cardBg}`}>
              <div className="flex items-start justify-between mb-3">
                <h4 className={`font-medium ${theme.textPrimary}`}>Education {index + 1}</h4>
                <button
                  onClick={() => removeEducation(index)}
                  className={`p-1 rounded-full ${theme.hoverBg} text-red-500 hover:bg-red-500/10 transition-all`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                    School/University *
                  </label>
                  <input
                    type="text"
                    value={edu.school}
                    onChange={(e) => updateEducation(index, "school", e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all text-sm`}
                    placeholder="Harvard University"
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                    Degree *
                  </label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all text-sm`}
                    placeholder="Bachelor of Science"
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                    Field of Study
                  </label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => updateEducation(index, "field", e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all text-sm`}
                    placeholder="Computer Science"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                      Start Year
                    </label>
                    <input
                      type="number"
                      value={edu.startYear}
                      onChange={(e) => updateEducation(index, "startYear", e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all text-sm`}
                      placeholder="2020"
                      min="1950"
                      max="2030"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                      End Year
                    </label>
                    <input
                      type="number"
                      value={edu.endYear}
                      onChange={(e) => updateEducation(index, "endYear", e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all text-sm`}
                      placeholder="2024"
                      min="1950"
                      max="2030"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1`}>
                  Description (Optional)
                </label>
                <textarea
                  value={edu.description}
                  onChange={(e) => updateEducation(index, "description", e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all resize-none text-sm`}
                  placeholder="Relevant coursework, achievements, etc."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Skills section edit
  const renderSkillsSection = () => {
    const handleSkillsKeyDown = (e) => {
      // Handle Enter, comma, or space to add skill
      if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
        e.preventDefault();
        const value = e.target.value.trim();
        if (value && !formData.skills?.includes(value)) {
          handleInputChange('skills', [...(formData.skills || []), value]);
          e.target.value = '';
        }
      }
    };

    const removeSkill = (indexToRemove) => {
      handleInputChange(
        'skills',
        formData.skills.filter((_, index) => index !== indexToRemove)
      );
    };

    return (
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
            Skills (press Space, Comma, or Enter to add)
          </label>
          
          {/* Skills Display */}
          {formData.skills && formData.skills.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-3 p-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg}`}>
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${theme.accentBg}/20 ${theme.accentColor} border ${theme.cardBorder} font-medium transition-all duration-200 hover:${theme.accentBg}/30`}
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
                handleInputChange('skills', [...(formData.skills || []), value]);
                e.target.value = '';
              }
            }}
            className={`w-full px-4 py-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:border-blue-400 focus:outline-none transition-all`}
            placeholder="Type a skill and press Space, Comma, or Enter"
          />
          <p className={`text-xs ${theme.textMuted} mt-2`}>
            Add skills by pressing Space, Comma (,), or Enter after each skill
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Saving Indicator - Outside modal for proper positioning */}
      {loading && <SavingIndicator message="Saving profile..." />}
      {showSuccess && <SavingIndicator success={true} />}
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${theme.cardBorder} ${theme.cardBg}`}
        >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${theme.divider} ${theme.cardBg}`}>
          <div className="flex items-center gap-3">
            <h2 className={`text-xl font-bold ${theme.textPrimary}`}>
              {activeSection ? `Edit ${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}` : 'Edit Profile'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${theme.hoverBg} ${theme.hoverText} transition-all`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!activeSection && renderMainView()}
          {activeSection === 'intro' && renderIntroSection()}
          {activeSection === 'photos' && renderPhotosSection()}
          {activeSection === 'about' && renderAboutSection()}
          {activeSection === 'skills' && renderSkillsSection()}
          {activeSection === 'experience' && renderExperienceSection()}
          {activeSection === 'education' && renderEducationSection()}
        </div>

        {/* Footer */}
        {activeSection && (
          <div className={`sticky bottom-0 z-10 flex flex-col gap-3 p-6 border-t ${theme.divider} ${theme.cardBg}`}>
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
                {error}
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className={`px-6 py-2.5 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50`}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}


export default EditProfileModalLinkedIn;
