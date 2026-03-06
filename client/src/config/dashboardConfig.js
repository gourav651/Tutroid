// Dashboard configuration for different user types
// Easy to add, remove, or modify features

export const DASHBOARD_CONFIG = {
  student: {
    navbar: {
      navItems: [
        { id: "connection", label: "Connection", icon: "Users" },
        { id: "for-you", label: "For You", icon: "Briefcase" },
        { id: "messaging", label: "Messaging", icon: "MessageSquare" },
      ],
    },
    leftSidebar: {
      profile: {
        name: "Deepak Mahato",
        role: "Computer Science Student",
        profileViewers: 30,
        avatar: "https://i.pravatar.cc/100",
      },
      menuItems: [
        { id: "saved-courses", label: "Saved Courses", icon: "BookOpen" },
        { id: "groups", label: "Groups", icon: "Users" },
        { id: "events", label: "Events", icon: "Calendar" },
        { id: "certificates", label: "Certificates", icon: "Award" },
      ],
    },
    feedSection: {
      placeholder: "Start a post...",
      postTypes: ["text", "link", "image"],
    },
    rightSidebar: {
      title: "Tutroid Trainers Available",
      items: [
        "🔥 AI Skills in demand",
        "📚 New React Courses Released",
        "🚀 Startup Hiring Trends",
        "💼 Remote Jobs Rising",
      ],
    },
  },
  trainer: {
    navbar: {
      navItems: [
        { id: "messaging", label: "Messaging", icon: "MessageSquare" },
      ],
    },
    leftSidebar: {
      profile: {
        name: "John Trainer",
        role: "JavaScript Expert Trainer",
        avatar: "https://i.pravatar.cc/120",
      },
      menuItems: [{ id: "reviews", label: "Reviews", icon: "Star" }],
    },
    feedSection: {
      placeholder:
        "Share your teaching experience or create a course update...",
      postTypes: ["text", "link", "image", "course"],
    },
    rightSidebar: {
      title: "Trainer Insights",
      items: [
        "📈 Your avg rating: 4.8/5",
        "👥 50 new student enrollments",
        "💰 +$1,200 earnings this month",
        "🎯 Course completion rate: 92%",
      ],
    },
  },
  institute: {
    navbar: {
      navItems: [
        { id: "messaging", label: "Messaging", icon: "MessageSquare" },
      ],
    },
    leftSidebar: {
      profile: {
        name: "Tech Academy Institute",
        role: "Educational Institution",
        trainersCount: 45,
        studentsCount: 1200,
        avatar: "https://i.pravatar.cc/130",
      },
      menuItems: [
        { id: "find-trainers", label: "Find Trainers", icon: "Search" },
        { id: "hired-trainers", label: "Hired Trainers", icon: "Users" },
        { id: "post-job", label: "Post Training Job", icon: "Briefcase" },
      ],
    },
    feedSection: {
      placeholder: "Post about training needs or institute updates...",
      postTypes: ["text", "link", "image", "job"],
    },
    rightSidebar: {
      title: "Institute Insights",
      items: [
        "🏢 5 new trainers applied today",
        "📊 Avg trainer rating: 4.6/5",
        "🎯 89% student satisfaction",
        "💼 12 active training programs",
      ],
    },
  },
};

// Feature flags - easily enable/disable features
export const FEATURE_FLAGS = {
  enableAnalytics: true,
  enableEarnings: true,
  enableCourseCreation: true,
  enableStudentTracking: true,
  enableAdvancedFilters: true,
};

// User types enum
export const USER_TYPES = {
  STUDENT: "student",
  TRAINER: "trainer",
  INSTITUTE: "institute",
};
