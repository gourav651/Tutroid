import { useState, useEffect } from "react";
import ApiService from "../services/api";
import { useTheme } from "../context/ThemeContext";
import {
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  Ban,
  Eye,
  MessageSquare,
  Search,
  Filter,
} from "lucide-react";

export default function AdminDashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrainers: 0,
    totalInstitutions: 0,
    totalStudents: 0,
    pendingReports: 0,
    resolvedReports: 0,
    activeRequests: 0,
    completedRequests: 0,
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadDashboardData();
    if (activeTab === "reports") {
      loadReports();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      // In a real implementation, you'd have specific admin endpoints
      // For now, we'll simulate with existing endpoints
      const [trainersResponse, institutionsResponse] = await Promise.all([
        ApiService.searchTrainers({ limit: 1000 }),
        ApiService.searchTrainers({ limit: 1 }), // Just to check if API works
      ]);

      if (trainersResponse.success) {
        setStats((prev) => ({
          ...prev,
          totalTrainers: trainersResponse.data.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getReports("PENDING");
      if (response.success) {
        setReports(response.data.reports);
        setStats((prev) => ({
          ...prev,
          pendingReports: response.data.reports.length,
        }));
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId, resolution) => {
    try {
      await ApiService.updateReport(reportId, {
        status: "RESOLVED",
        resolutionNote: resolution,
      });
      loadReports(); // Refresh reports
    } catch (error) {
      console.error("Failed to resolve report:", error);
    }
  };

  const handleSuspendUser = async (userId) => {
    try {
      await ApiService.suspendUser(userId);
      loadReports(); // Refresh reports
    } catch (error) {
      console.error("Failed to suspend user:", error);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, trend }) => (
    <div
      className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-6`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`${theme.textMuted} text-sm font-medium`}>{title}</p>
          <p className={`text-2xl font-bold ${theme.textPrimary}`}>{value}</p>
          {trend && (
            <div
              className={`flex items-center gap-1 mt-1 text-sm ${
                trend > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {Math.abs(trend)}% from last month
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>
          Admin Dashboard
        </h1>
        <p className={`${theme.textSecondary}`}>
          Manage users, reports, and system governance
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 mb-8 border-b ${theme.cardBorder}">
        {["overview", "reports", "users", "analytics"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? `border-blue-600 ${theme.accentColor}`
                : `border-transparent ${theme.textMuted} hover:${theme.textSecondary}`
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Users}
              title="Total Users"
              value={stats.totalUsers}
              color="bg-blue-600"
              trend={12}
            />
            <StatCard
              icon={Shield}
              title="Total Trainers"
              value={stats.totalTrainers}
              color="bg-indigo-600"
              trend={8}
            />
            <StatCard
              icon={AlertTriangle}
              title="Pending Reports"
              value={stats.pendingReports}
              color="bg-red-600"
              trend={-5}
            />
            <StatCard
              icon={CheckCircle}
              title="Completed Requests"
              value={stats.completedRequests}
              color="bg-green-600"
              trend={15}
            />
          </div>

          {/* Recent Activity */}
          <div
            className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-6`}
          >
            <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-4`}>
              Recent Activity
            </h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className={`flex items-center gap-4 p-3 rounded-lg ${theme.hoverBg}`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${theme.textPrimary}`}>
                      New trainer registration
                    </p>
                    <p className={`text-sm ${theme.textMuted}`}>
                      John Doe registered as a trainer
                    </p>
                  </div>
                  <div className={`text-sm ${theme.textMuted}`}>
                    2 hours ago
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-semibold ${theme.textPrimary}`}>
              Reports Management
            </h2>
            <div className="flex gap-2">
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg}`}
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg}`}
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className={`mt-4 ${theme.textMuted}`}>Loading reports...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-6`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.targetType === "TRAINER"
                              ? "bg-blue-100 text-blue-800"
                              : report.targetType === "MATERIAL"
                                ? "bg-green-100 text-green-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {report.targetType}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : report.status === "RESOLVED"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>

                      <h3 className={`font-semibold ${theme.textPrimary} mb-2`}>
                        {report.reason}
                      </h3>

                      {report.details && (
                        <p className={`${theme.textSecondary} text-sm mb-3`}>
                          {report.details}
                        </p>
                      )}

                      <div className={`text-xs ${theme.textMuted}`}>
                        Reported by {report.reporter?.user?.email} •
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() =>
                          handleResolveReport(
                            report.id,
                            "Resolved as valid report",
                          )
                        }
                        className={`px-3 py-1 rounded text-sm ${theme.accentBg} text-white hover:opacity-90`}
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleSuspendUser(report.targetId)}
                        className={`px-3 py-1 rounded text-sm bg-red-600 text-white hover:bg-red-700`}
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {reports.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle
                    className={`w-12 h-12 ${theme.textMuted} mx-auto mb-4`}
                  />
                  <p className={`${theme.textMuted}`}>No pending reports</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <h2 className={`text-xl font-semibold ${theme.textPrimary}`}>
            User Management
          </h2>
          <div
            className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-6`}
          >
            <p className={`${theme.textMuted}`}>
              User management features coming soon...
            </p>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <h2 className={`text-xl font-semibold ${theme.textPrimary}`}>
            System Analytics
          </h2>
          <div
            className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-6`}
          >
            <p className={`${theme.textMuted}`}>
              Analytics features coming soon...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
