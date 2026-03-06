import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Users,
  UserCheck,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Calendar,
  RefreshCw,
} from "lucide-react";

const AdminAnalytics = () => {
  const { theme } = useTheme();
  const [data, setData] = useState({
    overview: {},
    reports: {},
    usersByRole: [],
    dailyRegistrations: [],
    loading: true,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await ApiService.getAdminAnalytics();
      if (response.success) {
        setData({
          ...response.data,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setData((prev) => ({ ...prev, loading: false }));
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-4 sm:p-6 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`${theme.textMuted} text-xs sm:text-sm font-medium uppercase tracking-wider`}>{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold ${theme.textPrimary} mt-2`}>
            {data.loading ? "..." : value || 0}
          </p>
          {subtitle && <p className={`text-xs sm:text-sm ${theme.textMuted} mt-2`}>{subtitle}</p>}
        </div>
        <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <Icon className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

  // Format daily registrations data for chart
  const registrationChartData = data.dailyRegistrations?.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count: parseInt(item.count),
  })) || [];

  // Format users by role for pie chart
  const roleChartData = data.usersByRole?.map((item) => ({
    name: item.role,
    value: item.count,
  })) || [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${theme.textPrimary}`}>Analytics Overview</h1>
          <p className={`mt-1 text-sm sm:text-base ${theme.textSecondary}`}>
            Platform performance and user statistics
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${theme.cardBorder} ${theme.cardBg} ${theme.textSecondary} ${theme.hoverBg} transition-colors self-start sm:self-auto`}
        >
          <RefreshCw className={`w-4 h-4 ${data.loading ? "animate-spin" : ""}`} />
          <span className="text-sm">Refresh Data</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={data.overview.totalUsers}
          subtitle={`+${data.overview.newUsersLast30Days || 0} this month`}
          color="bg-blue-500"
        />
        <StatCard
          icon={UserCheck}
          title="Trainers"
          value={data.overview.totalTrainers}
          subtitle="Active professionals"
          color="bg-indigo-500"
        />
        <StatCard
          icon={BookOpen}
          title="Materials"
          value={data.overview.totalMaterials}
          subtitle="Learning resources"
          color="bg-green-500"
        />
        <StatCard
          icon={ClipboardList}
          title="Bookings"
          value={data.overview.totalRequests}
          subtitle="Total requests"
          color="bg-amber-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* User Registrations Chart */}
        <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-4 sm:p-6 shadow-sm`}>
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <TrendingUp className={`w-4 sm:w-5 h-4 sm:h-5 ${theme.textMuted}`} />
            <h2 className={`text-base sm:text-lg font-semibold ${theme.textPrimary}`}>
              User Registrations (Last 30 Days)
            </h2>
          </div>
          <div className="h-56 sm:h-64">
            {data.loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : registrationChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: "#3B82F6", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className={`${theme.textMuted} text-sm`}>No registration data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Users by Role Pie Chart */}
        <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-4 sm:p-6 shadow-sm`}>
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Users className={`w-4 sm:w-5 h-4 sm:h-5 ${theme.textMuted}`} />
            <h2 className={`text-base sm:text-lg font-semibold ${theme.textPrimary}`}>Users by Role</h2>
          </div>
          <div className="h-56 sm:h-64">
            {data.loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : roleChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={window.innerWidth < 640 ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className={`${theme.textMuted} text-sm`}>No role data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Reports Overview */}
        <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-4 sm:p-6 shadow-sm`}>
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <ClipboardList className={`w-4 sm:w-5 h-4 sm:h-5 ${theme.textMuted}`} />
            <h2 className={`text-base sm:text-lg font-semibold ${theme.textPrimary}`}>Reports Overview</h2>
          </div>
          <div className="h-56 sm:h-64">
            {data.loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Pending", value: data.reports.pending || 0 },
                    { name: "Resolved", value: data.reports.resolved || 0 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                    <Cell fill="#F59E0B" />
                    <Cell fill="#10B981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Platform Summary */}
        <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-4 sm:p-6 shadow-sm`}>
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Calendar className={`w-4 sm:w-5 h-4 sm:h-5 ${theme.textMuted}`} />
            <h2 className={`text-base sm:text-lg font-semibold ${theme.textPrimary}`}>Platform Summary</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className={`flex items-center justify-between py-2 sm:py-3 border-b ${theme.cardBorder}`}>
              <span className={`${theme.textSecondary} text-xs sm:text-sm`}>Total Students</span>
              <span className={`font-semibold ${theme.textPrimary} text-sm sm:text-base`}>
                {data.overview.totalStudents || 0}
              </span>
            </div>
            <div className={`flex items-center justify-between py-2 sm:py-3 border-b ${theme.cardBorder}`}>
              <span className={`${theme.textSecondary} text-xs sm:text-sm`}>Total Institutions</span>
              <span className={`font-semibold ${theme.textPrimary} text-sm sm:text-base`}>
                {data.overview.totalInstitutions || 0}
              </span>
            </div>
            <div className={`flex items-center justify-between py-2 sm:py-3 border-b ${theme.cardBorder}`}>
              <span className={`${theme.textSecondary} text-xs sm:text-sm`}>Pending Reports</span>
              <span className={`font-semibold text-sm sm:text-base ${data.reports.pending > 0 ? "text-red-500" : theme.textPrimary}`}>
                {data.reports.pending || 0}
              </span>
            </div>
            <div className={`flex items-center justify-between py-2 sm:py-3 border-b ${theme.cardBorder}`}>
              <span className={`${theme.textSecondary} text-xs sm:text-sm`}>Resolved Reports</span>
              <span className={`font-semibold text-green-500 text-sm sm:text-base`}>
                {data.reports.resolved || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 sm:py-3">
              <span className={`${theme.textSecondary} text-xs sm:text-sm`}>New Users (Last 30 Days)</span>
              <span className={`font-semibold ${theme.textPrimary} text-sm sm:text-base`}>
                {data.overview.newUsersLast30Days || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
