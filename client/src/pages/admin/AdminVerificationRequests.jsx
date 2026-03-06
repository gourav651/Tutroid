import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import ApiService from "../../services/api";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  Award,
  Building2,
  Star,
  Briefcase,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

const AdminVerificationRequests = () => {
  const { theme } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filter, pagination.page]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const queryParams = {
        status: filter,
        page: pagination.page,
        limit: pagination.limit,
      };

      const response = await ApiService.getVerificationRequests(queryParams);

      if (response.success) {
        setRequests(response.data.requests);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load verification requests:", error);
      alert(error.message || "Failed to load verification requests");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId, action) => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this verification request?`)) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await ApiService.reviewVerificationRequest(
        requestId,
        action,
        reviewNote || null
      );

      if (response.success) {
        alert(`Verification request ${action.toLowerCase()}d successfully`);
        setSelectedRequest(null);
        setReviewNote("");
        loadRequests();
      }
    } catch (error) {
      alert(error.message || `Failed to ${action.toLowerCase()} verification request`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock size={14} />
            Pending
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 size={14} />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle size={14} />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "TRAINER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Award size={12} />
            Trainer
          </span>
        );
      case "INSTITUTION":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Building2 size={12} />
            Institution
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>
            Verification Requests
          </h1>
          <p className={`${theme.textSecondary}`}>
            Review and manage verification requests from trainers and institutions
          </p>
        </div>

        {/* Filters */}
        <div className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-4 mb-6`}>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setFilter("PENDING");
                setPagination({ ...pagination, page: 1 });
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === "PENDING"
                  ? "bg-yellow-500 text-white"
                  : `${theme.hoverBg} ${theme.textSecondary}`
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                setFilter("ACCEPTED");
                setPagination({ ...pagination, page: 1 });
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === "ACCEPTED"
                  ? "bg-green-500 text-white"
                  : `${theme.hoverBg} ${theme.textSecondary}`
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => {
                setFilter("REJECTED");
                setPagination({ ...pagination, page: 1 });
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === "REJECTED"
                  ? "bg-red-500 text-white"
                  : `${theme.hoverBg} ${theme.textSecondary}`
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-12 text-center`}>
            <AlertCircle className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
              No {filter.toLowerCase()} requests
            </h3>
            <p className={`${theme.textSecondary}`}>
              There are no {filter.toLowerCase()} verification requests at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-6 hover:shadow-lg transition`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <img
                      src={
                        request.user.profilePicture ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          `${request.user.firstName} ${request.user.lastName}`
                        )}&background=random`
                      }
                      alt={`${request.user.firstName} ${request.user.lastName}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
                          {request.user.firstName} {request.user.lastName}
                        </h3>
                        {getRoleBadge(request.user.role)}
                        {getStatusBadge(request.status)}
                      </div>

                      <div className={`space-y-1 text-sm ${theme.textSecondary}`}>
                        <div className="flex items-center gap-2">
                          <Mail size={14} />
                          {request.user.email}
                        </div>
                        
                        {request.user.role === "TRAINER" && request.user.trainerProfile && (
                          <>
                            <div className="flex items-center gap-2">
                              <Award size={14} />
                              ID: {request.user.trainerProfile.uniqueId || "N/A"}
                            </div>
                            <div className="flex items-center gap-2">
                              <Star size={14} />
                              Rating: {request.user.trainerProfile.rating.toFixed(1)} / 5.0
                            </div>
                            <div className="flex items-center gap-2">
                              <Briefcase size={14} />
                              Experience: {request.user.trainerProfile.experience} years
                            </div>
                          </>
                        )}

                        {request.user.role === "INSTITUTION" && request.user.institutionProfile && (
                          <>
                            <div className="flex items-center gap-2">
                              <Building2 size={14} />
                              ID: {request.user.institutionProfile.uniqueId || "N/A"}
                            </div>
                            <div className="flex items-center gap-2">
                              <Star size={14} />
                              Rating: {request.user.institutionProfile.rating.toFixed(1)} / 5.0
                            </div>
                          </>
                        )}

                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          Requested: {new Date(request.createdAt).toLocaleDateString()}
                        </div>

                        {request.message && (
                          <div className="flex items-start gap-2 mt-2">
                            <MessageSquare size={14} className="mt-0.5" />
                            <span className="italic">"{request.message}"</span>
                          </div>
                        )}

                        {request.adminNote && (
                          <div className={`mt-2 p-2 rounded ${theme.inputBg} border ${theme.inputBorder}`}>
                            <span className="font-semibold">Admin Note:</span> {request.adminNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {request.status === "PENDING" && (
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                pagination.page === 1
                  ? `${theme.inputBg} ${theme.textMuted} cursor-not-allowed`
                  : `${theme.hoverBg} ${theme.textPrimary}`
              }`}
            >
              Previous
            </button>
            <span className={`px-4 py-2 ${theme.textSecondary}`}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                pagination.page === pagination.pages
                  ? `${theme.inputBg} ${theme.textMuted} cursor-not-allowed`
                  : `${theme.hoverBg} ${theme.textPrimary}`
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardBg} rounded-xl max-w-2xl w-full p-6 shadow-2xl`}>
            <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-4`}>
              Review Verification Request
            </h2>

            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={
                    selectedRequest.user.profilePicture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${selectedRequest.user.firstName} ${selectedRequest.user.lastName}`
                    )}&background=random`
                  }
                  alt={`${selectedRequest.user.firstName} ${selectedRequest.user.lastName}`}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h3 className={`text-xl font-semibold ${theme.textPrimary}`}>
                    {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                  </h3>
                  <p className={`${theme.textSecondary}`}>{selectedRequest.user.email}</p>
                  {getRoleBadge(selectedRequest.user.role)}
                </div>
              </div>

              {selectedRequest.message && (
                <div className={`p-4 rounded-lg ${theme.inputBg} border ${theme.inputBorder} mb-4`}>
                  <p className={`text-sm ${theme.textSecondary} italic`}>
                    "{selectedRequest.message}"
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className={`block text-sm font-semibold ${theme.textPrimary} mb-2`}>
                  Admin Note (Optional)
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add a note about your decision..."
                  className={`w-full px-4 py-3 rounded-lg ${theme.inputBg} border ${theme.inputBorder} ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleReview(selectedRequest.id, "APPROVE")}
                disabled={submitting}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <CheckCircle2 size={20} />
                {submitting ? "Approving..." : "Approve"}
              </button>
              <button
                onClick={() => handleReview(selectedRequest.id, "REJECT")}
                disabled={submitting}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <XCircle size={20} />
                {submitting ? "Rejecting..." : "Reject"}
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setReviewNote("");
                }}
                disabled={submitting}
                className={`px-6 py-3 border ${theme.cardBorder} ${theme.textSecondary} rounded-lg hover:${theme.hoverBg} transition font-medium ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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

export default AdminVerificationRequests;
