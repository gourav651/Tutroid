import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import ApiService from "../../services/api";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  CheckCircle,
  UserCog,
  RefreshCw,
} from "lucide-react";

const AdminDashboard = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrainers: 0,
    totalInstitutions: 0,
    pendingReports: 0,
    loading: true,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await ApiService.getAdminAnalytics();
      if (response.success) {
        setStats({
          totalUsers: response.data.overview.totalUsers,
          totalTrainers: response.data.overview.totalTrainers,
          totalInstitutions: response.data.overview.totalInstitutions,
          pendingReports: response.data.reports.pending,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin"); // Redirect to admin login (same page)
  };

  const navItems = [
    {
      path: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      end: true,
    },
    {
      path: "/admin/users",
      label: "Users",
      icon: Users,
      badge: null,
    },
    {
      path: "/admin/reports",
      label: "Reports",
      icon: FileText,
      badge: stats.pendingReports > 0 ? stats.pendingReports : null,
    },
    {
      path: "/admin/analytics",
      label: "Analytics",
      icon: BarChart3,
    },
    {
      path: "/admin/settings",
      label: "Settings",
      icon: UserCog,
    },
  ];

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      {/* Mobile Header */}
      <div className={`lg:hidden ${theme.navbarBg} border-b ${theme.cardBorder} p-3 sm:p-4 sticky top-0 z-50`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 sm:w-6 h-5 sm:h-6 text-blue-500" />
            <span className={`font-bold text-base sm:text-lg ${theme.textPrimary}`}>Admin Panel</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 sm:p-2 rounded-lg ${theme.hoverBg} ${theme.textPrimary} transition-colors`}
          >
            {isSidebarOpen ? <X className="w-4 sm:w-5 h-4 sm:h-5" /> : <Menu className="w-4 sm:w-5 h-4 sm:h-5" />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:static lg:translate-x-0 z-40 w-56 sm:w-64 h-screen ${theme.navbarBg} border-r ${theme.cardBorder} transition-transform duration-200 ease-in-out overflow-y-auto`}
        >
          {/* Logo */}
          <div className={`hidden lg:flex items-center gap-2 p-4 sm:p-6 border-b ${theme.cardBorder}`}>
            <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-blue-500" />
            <div>
              <h1 className={`font-bold text-lg sm:text-xl ${theme.textPrimary}`}>Admin Panel</h1>
              <p className={`text-[10px] sm:text-xs ${theme.textMuted}`}>Management System</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-2 sm:p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                    isActive
                      ? "bg-blue-500 text-white shadow-lg"
                      : `${theme.textSecondary} ${theme.hoverBg} hover:${theme.textPrimary}`
                  }`
                }
              >
                <item.icon className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="p-2 sm:p-4 mt-4">
            <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-3 sm:p-4 space-y-2 sm:space-y-3 transition-all duration-200`}>
              <h3 className={`text-xs sm:text-sm font-medium ${theme.textMuted}`}>Quick Stats</h3>
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className={theme.textSecondary}>Total Users</span>
                  <span className={`font-medium ${theme.textPrimary}`}>
                    {stats.loading ? "..." : stats.totalUsers}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className={theme.textSecondary}>Trainers</span>
                  <span className={`font-medium ${theme.textPrimary}`}>
                    {stats.loading ? "..." : stats.totalTrainers}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className={theme.textSecondary}>Pending Reports</span>
                  <span className={`font-medium ${stats.pendingReports > 0 ? "text-red-500" : theme.textPrimary}`}>
                    {stats.loading ? "..." : stats.pendingReports}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Info & Logout */}
          <div className={`p-2 sm:p-4 border-t ${theme.cardBorder} mt-auto`}>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-xs sm:text-sm flex-shrink-0">
                {user?.firstName?.[0] || user?.email?.[0] || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${theme.textPrimary} truncate text-xs sm:text-sm`}>
                  {user?.firstName || user?.email}
                </p>
                <p className={`text-[10px] sm:text-xs ${theme.textMuted}`}>Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm ${theme.textSecondary} ${theme.hoverBg} hover:text-red-500 transition-all duration-200`}
            >
              <LogOut className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
              <span className="truncate">Logout</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen overflow-auto">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Default dashboard view when at /admin
export const AdminOverview = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    overview: {},
    reports: {},
    usersByRole: [],
    recentUsers: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true, error: null }));
      const response = await ApiService.getAdminAnalytics();
      if (response.success) {
        setStats({
          ...response.data,
          loading: false,
          error: null,
        });
      } else {
        setStats((prev) => ({ 
          ...prev, 
          loading: false, 
          error: response.message || "Failed to load analytics" 
        }));
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setStats((prev) => ({ 
        ...prev, 
        loading: false, 
        error: error.message || "Failed to load analytics" 
      }));
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`${theme.textMuted} text-xs sm:text-sm font-medium uppercase tracking-wider`}>{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold ${theme.textPrimary} mt-2`}>
            {stats.loading ? "..." : value || 0}
          </p>
          {subtitle && <p className={`text-xs sm:text-sm ${theme.textMuted} mt-2`}>{subtitle}</p>}
        </div>
        <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl ${color} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <Icon className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${theme.textPrimary}`}>Dashboard</h1>
          <p className={`mt-1 text-sm sm:text-base ${theme.textSecondary}`}>
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={stats.loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${theme.cardBorder} ${theme.cardBg} ${theme.textSecondary} ${theme.hoverBg} transition-colors disabled:opacity-50 self-start sm:self-auto`}
        >
          <RefreshCw className={`w-4 h-4 ${stats.loading ? "animate-spin" : ""}`} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {stats.error && (
        <div className={`p-4 ${theme.cardBg} border ${theme.cardBorder} rounded-lg`}>
          <p className="text-red-500 text-sm">{stats.error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.overview.totalUsers}
          color="bg-blue-500"
          subtitle={`+${stats.overview.newUsersLast30Days || 0} this month`}
        />
        <StatCard
          icon={Shield}
          title="Trainers"
          value={stats.overview.totalTrainers}
          color="bg-indigo-500"
        />
        <StatCard
          icon={CheckCircle}
          title="Institutions"
          value={stats.overview.totalInstitutions}
          color="bg-green-500"
        />
        <StatCard
          icon={AlertTriangle}
          title="Pending Reports"
          value={stats.reports.pending}
          color="bg-red-500"
          subtitle="Requires attention"
        />
      </div>

      {/* Recent Users */}
      <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-4 sm:p-6 shadow-sm`}>
        <h2 className={`text-lg sm:text-xl font-semibold ${theme.textPrimary} mb-4 flex items-center gap-2`}>
          <Users className="w-5 h-5 text-blue-500" />
          Recent Registrations
        </h2>
        {stats.loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : stats.recentUsers?.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className={`border-b ${theme.cardBorder}`}>
                    <th className={`text-left py-3 px-4 ${theme.textMuted} font-medium text-xs sm:text-sm`}>User</th>
                    <th className={`text-left py-3 px-4 ${theme.textMuted} font-medium text-xs sm:text-sm`}>Role</th>
                    <th className={`text-left py-3 px-4 ${theme.textMuted} font-medium text-xs sm:text-sm`}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((user) => (
                    <tr key={user.id} className={`border-b ${theme.cardBorder} last:border-0 ${theme.hoverBg} transition-colors duration-200`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-medium text-xs sm:text-sm flex-shrink-0">
                            {user.firstName?.[0] || user.email?.[0] || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-medium ${theme.textPrimary} text-xs sm:text-sm truncate`}>
                              {user.firstName || user.lastName
                                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                : user.email}
                            </p>
                            {user.firstName && (
                              <p className={`text-xs ${theme.textMuted} truncate`}>{user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                            user.role === "ADMIN"
                              ? "bg-purple-500/10 text-purple-500"
                              : user.role === "TRAINER"
                              ? "bg-blue-500/10 text-blue-500"
                              : user.role === "INSTITUTION"
                              ? "bg-green-500/10 text-green-500"
                              : `${theme.cardBg} ${theme.textMuted}`
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className={`py-3 px-4 ${theme.textMuted} text-xs sm:text-sm`}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className={`${theme.textMuted} text-center py-8 text-sm`}>No recent registrations</p>
        )}
      </div>
    </div>
  );
};

// Settings page with Transfer Admin feature
export const AdminSettings = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleTransferAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await ApiService.transferAdmin({
        newAdminEmail,
        currentPassword,
      });

      if (response.success) {
        setSuccess("Admin privileges transferred successfully! You will be logged out.");
        setTimeout(() => {
          logout();
          navigate("/admin/login");
        }, 3000);
      } else {
        setError(response.message || "Failed to transfer admin privileges");
      }
    } catch (err) {
      setError(err.message || "Failed to transfer admin privileges");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold ${theme.textPrimary}`}>Admin Settings</h1>
        <p className={`mt-1 text-sm sm:text-base ${theme.textSecondary}`}>
          Manage admin account and transfer privileges.
        </p>
      </div>

      {/* Current Admin Info */}
      <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-4 sm:p-6 shadow-sm`}>
        <h2 className={`text-lg sm:text-xl font-semibold ${theme.textPrimary} mb-4`}>
          Current Admin
        </h2>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg sm:text-2xl font-medium flex-shrink-0">
            {user?.firstName?.[0] || user?.email?.[0] || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-base sm:text-lg font-medium ${theme.textPrimary} truncate`}>
              {user?.firstName || user?.email}
            </p>
            <p className={`${theme.textMuted} text-sm truncate`}>{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-xs sm:text-sm font-medium">
              Administrator
            </span>
          </div>
        </div>
      </div>

      {/* Transfer Admin Section */}
      <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-4 sm:p-6 shadow-sm`}>
        <h2 className={`text-lg sm:text-xl font-semibold ${theme.textPrimary} mb-4`}>
          Transfer Admin Privileges
        </h2>
        <p className={`${theme.textSecondary} mb-6 text-sm sm:text-base`}>
          Transfer your admin privileges to another user. This action cannot be undone. 
          You will be demoted to a regular student account after the transfer.
        </p>

        {!showTransferModal ? (
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm sm:text-base"
          >
            Transfer Admin Rights
          </button>
        ) : (
          <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-xl p-4 sm:p-6`}>
            <h3 className={`text-base sm:text-lg font-medium ${theme.textPrimary} mb-4`}>
              Confirm Admin Transfer
            </h3>

            {error && (
              <div className={`mb-4 p-3 sm:p-4 ${theme.cardBg} border border-red-500/50 rounded-lg flex items-start gap-3`}>
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-500 text-xs sm:text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className={`mb-4 p-3 sm:p-4 ${theme.cardBg} border border-green-500/50 rounded-lg flex items-start gap-3`}>
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-green-500 text-xs sm:text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={handleTransferAdmin} className="space-y-4">
              <div>
                <label className={`block text-xs sm:text-sm font-medium ${theme.textSecondary} mb-2`}>
                  New Admin Email
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Enter email of the new admin"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${theme.cardBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base`}
                  required
                />
                <p className={`text-xs ${theme.textMuted} mt-1`}>
                  The user must already have an account on the platform.
                </p>
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-medium ${theme.textSecondary} mb-2`}>
                  Your Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${theme.cardBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base`}
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 border ${theme.cardBorder} rounded-lg font-medium ${theme.textSecondary} ${theme.hoverBg} transition-colors text-sm sm:text-base`}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-4 sm:p-6 shadow-sm`}>
        <h3 className={`text-base sm:text-lg font-medium ${theme.textPrimary} mb-3`}>
          How to Transfer Admin Rights
        </h3>
        <ol className={`list-decimal list-inside space-y-2 ${theme.textSecondary} text-xs sm:text-sm`}>
          <li>Enter the email address of the user who will become the new admin</li>
          <li>The user must already have an account (Student, Trainer, or Institution)</li>
          <li>Enter your current password to confirm the transfer</li>
          <li>Click "Confirm Transfer" to complete the process</li>
          <li>You will be logged out and your account will become a Student account</li>
          <li>The new admin can login with their existing credentials</li>
        </ol>
      </div>
    </div>
  );
};

export default AdminDashboard;
