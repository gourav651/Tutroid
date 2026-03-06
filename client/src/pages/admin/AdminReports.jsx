import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/api";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  User,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MoreVertical,
} from "lucide-react";

const AdminReports = () => {
  const { theme } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    targetType: "",
  });
  const [actionLoading, setActionLoading] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");

  useEffect(() => {
    fetchReports();
  }, [pagination.page, filters.status, filters.targetType]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.targetType && { targetType: filters.targetType }),
      };

      const response = await ApiService.getAdminReports(queryParams);
      if (response.success) {
        setReports(response.data.reports);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (!selectedReport) return;

    setActionLoading((prev) => ({ ...prev, [selectedReport.id]: true }));
    try {
      const response = await ApiService.takeReportAction(selectedReport.id, {
        action,
        resolutionNote,
      });
      if (response.success) {
        setReports((prev) =>
          prev.map((report) =>
            report.id === selectedReport.id
              ? { ...report, status: action === "REJECT" ? "DISMISSED" : "RESOLVED" }
              : report
          )
        );
        setShowActionModal(false);
        setSelectedReport(null);
        setResolutionNote("");
      }
    } catch (error) {
      console.error("Failed to take action:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [selectedReport.id]: false }));
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "DISMISSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTargetTypeBadgeColor = (type) => {
    switch (type) {
      case "TRAINER":
        return "bg-blue-100 text-blue-800";
      case "MATERIAL":
        return "bg-green-100 text-green-800";
      case "REVIEW":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReportedItemName = (report) => {
    if (report.trainerProfile) {
      const user = report.trainerProfile.user;
      return `Trainer: ${user?.firstName || user?.lastName ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim() : user?.email}`;
    }
    if (report.institutionProfile) {
      return `Institution: ${report.institutionProfile.name}`;
    }
    if (report.material) {
      return `Material: ${report.material.title}`;
    }
    return "Unknown";
  };

  const getReportedUserId = (report) => {
    if (report.trainerProfile) {
      return report.trainerProfile.userId;
    }
    if (report.institutionProfile) {
      return report.institutionProfile.userId;
    }
    if (report.material) {
      return report.material.trainer?.user?.id;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>Reports Management</h1>
          <p className="mt-1 text-2xl font-bold text-black">
            Review and moderate user reports
          </p>
        </div>
        <button
          onClick={fetchReports}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg} transition-colors`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-4`}>
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
            }
            className={`px-4 py-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
          <select
            value={filters.targetType}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, targetType: e.target.value, page: 1 }))
            }
            className={`px-4 py-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">All Types</option>
            <option value="TRAINER">Trainer</option>
            <option value="MATERIAL">Material</option>
            <option value="REVIEW">Review</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-12 text-center`}>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className={`mt-4 ${theme.textMuted}`}>Loading reports...</p>
          </div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div
              key={report.id}
              className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-6`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTargetTypeBadgeColor(
                        report.targetType
                      )}`}
                    >
                      {report.targetType}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        report.status
                      )}`}
                    >
                      {report.status}
                    </span>
                    <span className={`text-sm ${theme.textMuted}`}>
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Reported Item */}
                  <div className="mb-3">
                    <p className={`text-sm ${theme.textMuted} mb-1`}>Reported Item</p>
                    <p className={`font-medium ${theme.textPrimary}`}>
                      {getReportedItemName(report)}
                    </p>
                  </div>

                  {/* Reason */}
                  <div className="mb-3">
                    <p className={`text-sm ${theme.textMuted} mb-1`}>Reason</p>
                    <p className={`${theme.textPrimary}`}>{report.reason}</p>
                  </div>

                  {/* Details */}
                  {report.details && (
                    <div className="mb-3">
                      <p className={`text-sm ${theme.textMuted} mb-1`}>Details</p>
                      <p className={`text-sm ${theme.textSecondary}`}>{report.details}</p>
                    </div>
                  )}

                  {/* Reporter */}
                  <div className="flex items-center gap-2">
                    <User className={`w-4 h-4 ${theme.textMuted}`} />
                    <span className={`text-sm ${theme.textSecondary}`}>
                      Reported by: {report.reporter?.email}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {report.status === "PENDING" && (
                  <div className="flex lg:flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowActionModal(true);
                      }}
                      disabled={actionLoading[report.id]}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Take Action
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-12 text-center`}>
            <CheckCircle className={`w-12 h-12 ${theme.textMuted} mx-auto mb-4`} />
            <p className={`${theme.textMuted}`}>No reports found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className={`flex items-center justify-between ${theme.cardBg} rounded-lg border ${theme.cardBorder} px-6 py-4`}>
          <p className={`text-sm ${theme.textMuted}`}>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} reports
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={pagination.page === 1}
              className={`p-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`px-4 py-2 ${theme.textSecondary}`}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={pagination.page === pagination.pages}
              className={`p-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} max-w-md w-full p-6`}>
            <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
              Take Action on Report
            </h3>
            <p className={`${theme.textSecondary} mb-4`}>
              {getReportedItemName(selectedReport)}
            </p>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                Resolution Note (Optional)
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Add notes about the resolution..."
                className={`w-full px-4 py-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleAction("RESOLVE")}
                disabled={actionLoading[selectedReport.id]}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Resolve Report
              </button>
              <button
                onClick={() => handleAction("BAN_USER")}
                disabled={actionLoading[selectedReport.id] || !getReportedUserId(selectedReport)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Ban User
              </button>
              <button
                onClick={() => handleAction("REJECT")}
                disabled={actionLoading[selectedReport.id]}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Dismiss Report
              </button>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedReport(null);
                  setResolutionNote("");
                }}
                className={`w-full px-4 py-2 border ${theme.inputBorder} ${theme.textSecondary} rounded-lg hover:${theme.hoverBg} transition-colors`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
