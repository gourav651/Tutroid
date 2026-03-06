import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Send, CheckCircle, Clock, X, MessageSquare, User, Calendar, Briefcase } from 'lucide-react';

export default function RequestManagement({ userType }) {
  const { theme } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, ACCEPTED, COMPLETED
  const [activeTab, setActiveTab] = useState('received'); // received, sent
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filter, activeTab]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const status = filter === 'ALL' ? undefined : filter;
      const response = await ApiService.getMyRequests(status);
      if (response.success) {
        // Filter based on active tab
        const filteredRequests = response.data.filter(request => {
          if (activeTab === 'sent') {
            return request.initiatedBy === userType.toUpperCase();
          } else {
            return request.initiatedBy !== userType.toUpperCase();
          }
        });
        setRequests(filteredRequests);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, action) => {
    try {
      await ApiService.respondToRequest(requestId, { action });
      loadRequests(); // Refresh list
    } catch (error) {
      console.error('Failed to respond to request:', error);
    }
  };

  const handleMarkComplete = async (requestId) => {
    try {
      await ApiService.markRequestComplete(requestId);
      loadRequests(); // Refresh list
    } catch (error) {
      console.error('Failed to mark request complete:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'ACCEPTED':
        return 'text-green-600 bg-green-100';
      case 'COMPLETED':
        return 'text-blue-600 bg-blue-100';
      case 'REJECTED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'ACCEPTED':
        return <CheckCircle className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const canRespond = (request) => {
    if (request.status !== 'PENDING') return false;
    
    if (userType === 'TRAINER') {
      return request.initiatedBy === 'INSTITUTION';
    } else if (userType === 'INSTITUTION') {
      return request.initiatedBy === 'TRAINER';
    }
    
    return false;
  };

  const canMarkComplete = (request) => {
    if (request.status !== 'ACCEPTED') return false;
    
    const userField = userType === 'TRAINER' ? 'trainerMarkedComplete' : 'institutionMarkedComplete';
    return !request[userField];
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>
          Request Management
        </h1>
        <p className={`${theme.textSecondary}`}>
          Manage your hiring requests and collaborations
        </p>
      </div>

      {/* New Request Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowNewRequest(true)}
          className={`px-4 py-2 rounded-lg ${theme.accentBg} text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2`}
        >
          <Send className="w-4 h-4" />
          Send New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b ${theme.cardBorder}">
        <button
          onClick={() => setActiveTab('received')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'received'
              ? `border-blue-600 ${theme.accentColor}`
              : `border-transparent ${theme.textMuted} hover:${theme.textSecondary}`
          }`}
        >
          Requests Received
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'sent'
              ? `border-blue-600 ${theme.accentColor}`
              : `border-transparent ${theme.textMuted} hover:${theme.textSecondary}`
          }`}
        >
          Requests Sent
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? `${theme.accentBg} text-white`
                : `${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg}`
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className={`mt-4 ${theme.textMuted}`}>Loading requests...</p>
        </div>
      )}

      {/* Requests List */}
      {!loading && (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              userType={userType}
              onRespond={handleRespond}
              onMarkComplete={handleMarkComplete}
              onReview={(request) => {
                setSelectedRequest(request);
                setShowReviewModal(true);
              }}
              canRespond={canRespond(request)}
              canMarkComplete={canMarkComplete(request)}
            />
          ))}
          
          {requests.length === 0 && (
            <div className="text-center py-12">
              <p className={`${theme.textMuted}`}>No requests found</p>
            </div>
          )}
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequest && (
        <NewRequestModal
          onClose={() => setShowNewRequest(false)}
          onSuccess={() => {
            setShowNewRequest(false);
            loadRequests();
          }}
          userType={userType}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            setShowReviewModal(false);
            setSelectedRequest(null);
            loadRequests();
          }}
        />
      )}
    </div>
  );
}

function RequestCard({ request, userType, onRespond, onMarkComplete, onReview, canRespond, canMarkComplete }) {
  const { theme } = useTheme();
  
  const otherParty = userType === 'TRAINER' ? request.institution : request.trainer;
  const otherPartyName = otherParty?.name || otherParty?.user?.email?.split('@')[0] || 'Unknown';
  
  const isCompleted = request.status === 'COMPLETED';
  const needsDualConfirmation = request.status === 'ACCEPTED' && 
    (!request.trainerMarkedComplete || !request.institutionMarkedComplete);

  return (
    <div className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {otherPartyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className={`font-semibold ${theme.textPrimary}`}>
                {otherPartyName}
              </h3>
              <p className={`text-sm ${theme.textMuted}`}>
                {userType === 'TRAINER' ? 'Institution' : 'Trainer'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className={`w-4 h-4 ${theme.textMuted}`} />
              <span className={theme.textMuted}>
                {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {getStatusIcon(request.status)}
              <span>{request.status}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <p className={`text-sm ${theme.textMuted} mb-1`}>
            Initiated by {request.initiatedBy === userType.toUpperCase() ? 'you' : 'them'}
          </p>
          {needsDualConfirmation && (
            <p className={`text-xs ${theme.textMuted}`}>
              Waiting for confirmation
            </p>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3">
        {canRespond && (
          <>
            <button
              onClick={() => onRespond(request.id, 'ACCEPT')}
              className={`px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors`}
            >
              Accept
            </button>
            <button
              onClick={() => onRespond(request.id, 'REJECT')}
              className={`px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors`}
            >
              Reject
            </button>
          </>
        )}
        
        {canMarkComplete && (
          <button
            onClick={() => onMarkComplete(request.id)}
            className={`px-4 py-2 rounded-lg ${theme.accentBg} text-white font-medium hover:opacity-90 transition-opacity`}
          >
            Mark Complete
          </button>
        )}
        
        {isCompleted && (
          <button
            onClick={() => onReview(request)}
            className={`px-4 py-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg} transition-colors flex items-center gap-2`}
          >
            <MessageSquare className="w-4 h-4" />
            Leave Review
          </button>
        )}
      </div>
    </div>
  );
}

function NewRequestModal({ onClose, onSuccess, userType }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    targetId: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await ApiService.searchTrainers({ 
        skills: query,
        limit: 5 
      });
      if (response.success) {
        setSearchResults(response.data.trainers);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.targetId || !formData.message) return;

    setLoading(true);
    try {
      await ApiService.sendRequest({
        targetId: formData.targetId,
        message: formData.message
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to send request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${theme.cardBg} rounded-xl max-w-md w-full p-6 border ${theme.cardBorder}`}>
        <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
          Send New Request
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              {userType === 'TRAINER' ? 'Institution' : 'Trainer'}
            </label>
            <input
              type="text"
              placeholder={`Search for ${userType === 'TRAINER' ? 'institutions' : 'trainers'}...`}
              onChange={(e) => handleSearch(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className={`mt-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} max-h-32 overflow-y-auto`}>
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, targetId: result.id }));
                      setSearchResults([]);
                    }}
                    className={`w-full px-3 py-2 text-left hover:${theme.hoverBg} transition-colors flex items-center gap-2`}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {result.user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-sm ${theme.textSecondary}`}>
                      {result.user?.email?.split('@')[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Describe your request..."
              className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
              rows="4"
              required
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.targetId || !formData.message || loading}
              className={`flex-1 px-4 py-2 rounded-lg ${theme.accentBg} text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewModal({ request, onClose, onSuccess }) {
  const { theme } = useTheme();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    try {
      await ApiService.createReview({
        requestId: request.id,
        rating,
        comment
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${theme.cardBg} rounded-xl max-w-md w-full p-6 border ${theme.cardBorder}`}>
        <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
          Leave a Review
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= (hover || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : theme.textMuted
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
              rows="4"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || submitting}
              className={`flex-1 px-4 py-2 rounded-lg ${theme.accentBg} text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
