import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Mail, Phone, Calendar, Star, TrendingUp, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import ApiService from "../../../services/api";
import LoadingScreen from "../../../components/LoadingScreen";

const Students = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, inactive
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call when students endpoint is available
      // const response = await ApiService.getMyStudents();
      // Mock data for now
      const mockStudents = [
        {
          id: 1,
          firstName: "Deepak",
          lastName: "Mahato",
          email: "deepak@example.com",
          phone: "+91 9876543210",
          avatar: "https://i.pravatar.cc/100?img=1",
          enrolledCourses: 3,
          completedCourses: 1,
          totalSpent: 4500,
          rating: 4.8,
          status: "active",
          lastActive: "2 hours ago",
          joinedAt: "2024-01-15",
        },
        {
          id: 2,
          firstName: "Priya",
          lastName: "Sharma",
          email: "priya@example.com",
          phone: "+91 9876543211",
          avatar: "https://i.pravatar.cc/100?img=2",
          enrolledCourses: 2,
          completedCourses: 2,
          totalSpent: 3200,
          rating: 4.9,
          status: "active",
          lastActive: "1 hour ago",
          joinedAt: "2024-02-10",
        },
        {
          id: 3,
          firstName: "Rahul",
          lastName: "Kumar",
          email: "rahul@example.com",
          phone: "+91 9876543212",
          avatar: "https://i.pravatar.cc/100?img=3",
          enrolledCourses: 1,
          completedCourses: 0,
          totalSpent: 1500,
          rating: 4.5,
          status: "inactive",
          lastActive: "2 weeks ago",
          joinedAt: "2024-03-05",
        },
      ];
      setStudents(mockStudents);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesFilter = filter === "all" || student.status === filter;
    const matchesSearch = searchQuery === "" || 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStudentClick = (studentId) => {
    navigate(`/trainer/students/${studentId}`);
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
            <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>My Students</h1>
            <p className={`${theme.textSecondary} mt-1`}>Track and manage your students</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg ${theme.cardBg} border ${theme.cardBorder}`}>
              <div className={`text-sm ${theme.textMuted}`}>Total Students</div>
              <div className={`text-2xl font-bold ${theme.textPrimary}`}>{students.length}</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className={`flex gap-2 p-2 rounded-lg ${theme.cardBg} w-fit`}>
            {["all", "active", "inactive"].map((status) => (
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
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 px-4 py-2 rounded-lg ${theme.inputBg} border ${theme.inputBorder} ${theme.inputText} outline-none focus:border-blue-400`}
          />
        </div>

        {/* Students Table */}
        <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} overflow-hidden`}>
          <table className="w-full">
            <thead className={`${theme.cardBg2} border-b ${theme.cardBorder}`}>
              <tr>
                <th className={`text-left py-4 px-6 font-semibold ${theme.textPrimary}`}>Student</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme.textPrimary}`}>Email</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme.textPrimary}`}>Courses</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme.textPrimary}`}>Spent</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme.textPrimary}`}>Rating</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme.textPrimary}`}>Status</th>
                <th className={`text-left py-4 px-6 font-semibold ${theme.textPrimary}`}>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className={`border-b ${theme.cardBorder} hover:${theme.hoverBg} cursor-pointer transition`}
                  onClick={() => handleStudentClick(student.id)}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatar}
                        alt={student.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className={`font-medium ${theme.textPrimary}`}>
                          {student.firstName} {student.lastName}
                        </div>
                        <div className={`text-xs ${theme.textMuted}`}>
                          Joined {new Date(student.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={`py-4 px-6 ${theme.textSecondary}`}>{student.email}</td>
                  <td className="py-4 px-6">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${theme.hoverBg} ${theme.textPrimary} text-sm`}>
                      <Users size={14} />
                      <span>{student.enrolledCourses} enrolled</span>
                    </div>
                  </td>
                  <td className={`py-4 px-6 font-medium ${theme.textPrimary}`}>
                    ₹{student.totalSpent.toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className={theme.textPrimary}>{student.rating}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      student.status === "active"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-gray-500/10 text-gray-400"
                    }`}>
                      {student.status === "active" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {student.status}
                    </span>
                  </td>
                  <td className={`py-4 px-6 ${theme.textSecondary} text-sm`}>{student.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className={`w-16 h-16 mx-auto mb-4 ${theme.textMuted}`} />
              <h3 className={`text-xl font-semibold ${theme.textPrimary} mb-2`}>No students found</h3>
              <p className={`${theme.textSecondary}`}>Students you enroll in courses will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Students;
