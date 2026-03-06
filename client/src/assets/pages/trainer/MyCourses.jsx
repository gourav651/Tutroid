import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Clock, Users, Star, Play, FileText, MoreVertical, Edit, Trash2, Eye, TrendingUp } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import ApiService from "../../../services/api";
import LoadingScreen from "../../../components/LoadingScreen";

const MyCourses = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, archived

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call when courses endpoint is available
      // const response = await ApiService.getMyCourses();
      // Mock data for now
      const mockCourses = [
        {
          id: 1,
          title: "Complete JavaScript Bootcamp",
          description: "Master JavaScript from basics to advanced concepts",
          students: 245,
          rating: 4.8,
          reviews: 127,
          status: "active",
          thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
          modules: 12,
          duration: "24 hours",
          createdAt: "2024-01-15",
        },
        {
          id: 2,
          title: "React JS - The Complete Guide",
          description: "Learn React including Hooks, Context, and Next.js",
          students: 189,
          rating: 4.9,
          reviews: 95,
          status: "active",
          thumbnail: "https://images.unsplash.com/photo-1633356122160-f4f890528bf2?w=400",
          modules: 8,
          duration: "18 hours",
          createdAt: "2024-02-20",
        },
        {
          id: 3,
          title: "Node.js Backend Development",
          description: "Build REST APIs and real-time applications",
          students: 156,
          rating: 4.7,
          reviews: 78,
          status: "archived",
          thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400",
          modules: 10,
          duration: "20 hours",
          createdAt: "2023-11-10",
        },
      ];
      setCourses(mockCourses);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = filter === "all" 
    ? courses 
    : courses.filter(course => course.status === filter);

  const handleCourseClick = (courseId) => {
    navigate(`/trainer/courses/${courseId}`);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className={`min-h-screen ${theme.bg} p-6`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>My Courses</h1>
            <p className={`${theme.textSecondary} mt-1`}>Manage and track your course performance</p>
          </div>
          <button
            onClick={() => navigate("/trainer/courses/create")}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
          >
            <BookOpen size={18} />
            Create Course
          </button>
        </div>

        {/* Filters */}
        <div className={`flex gap-2 mb-6 p-2 rounded-lg ${theme.cardBg} w-fit`}>
          {["all", "active", "archived"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md capitalize transition ${
                filter === status
                  ? "bg-blue-500 text-white"
                  : `${theme.textSecondary} hover:${theme.hoverBg}`
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className={`${theme.cardBg} rounded-xl overflow-hidden border ${theme.cardBorder} hover:shadow-xl transition-all cursor-pointer group`}
              onClick={() => handleCourseClick(course.id)}
            >
              {/* Thumbnail */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    course.status === "active" 
                      ? "bg-green-500/90 text-white" 
                      : "bg-gray-500/90 text-white"
                  }`}>
                    {course.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2 line-clamp-1`}>
                  {course.title}
                </h3>
                <p className={`${theme.textSecondary} text-sm mb-4 line-clamp-2`}>
                  {course.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <div className={`flex items-center gap-1 ${theme.textSecondary}`}>
                      <Users size={14} />
                      <span>{course.students}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${theme.textSecondary}`}>
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span>{course.rating}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${theme.textMuted}`}>
                    <Clock size={12} />
                    <span>{course.modules} modules</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t ${theme.cardBorder}">
                  <button className={`flex-1 py-2 rounded-md ${theme.hoverBg} ${theme.textPrimary} text-sm font-medium hover:bg-blue-500/10 hover:text-blue-400 transition`}>
                    Edit
                  </button>
                  <button className={`flex-1 py-2 rounded-md ${theme.hoverBg} ${theme.textPrimary} text-sm font-medium hover:bg-blue-500/10 hover:text-blue-400 transition`}>
                    Analytics
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className={`text-center py-12 ${theme.cardBg} rounded-xl`}>
            <BookOpen className={`w-16 h-16 mx-auto mb-4 ${theme.textMuted}`} />
            <h3 className={`text-xl font-semibold ${theme.textPrimary} mb-2`}>No courses found</h3>
            <p className={`${theme.textSecondary} mb-4`}>Create your first course to get started</p>
            <button
              onClick={() => navigate("/trainer/courses/create")}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition"
            >
              Create Course
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
