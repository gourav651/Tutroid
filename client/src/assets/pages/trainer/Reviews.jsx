import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, User, Calendar, ThumbsUp, MessageSquare, Filter, TrendingUp, Award } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import ApiService from "../../../services/api";
import LoadingScreen from "../../../components/LoadingScreen";
import ReviewsListModal from "../../../components/ReviewsListModal";
import { DEFAULT_PROFILE_IMAGE } from "../../../utils/constants";

const Reviews = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState("all"); // all, 5, 4, 3, 2, 1
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    fetchReviews();
    
    // Listen for custom event when a new review is added
    const handleNewReview = () => {
      fetchReviews();
    };
    
    window.addEventListener("reviewAdded", handleNewReview);
    
    return () => {
      window.removeEventListener("reviewAdded", handleNewReview);
    };
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getMyReviews();
      
      if (response?.success) {
        // Transform the data to match the component's expected format
        const transformedReviews = (response.data || []).map(review => ({
          id: review.id,
          reviewer: {
            firstName: review.user?.firstName || "Anonymous",
            lastName: review.user?.lastName || "",
            avatar: review.user?.profilePicture || review.user?.avatar || DEFAULT_PROFILE_IMAGE,
          },
          rating: review.rating,
          comment: review.review || "",
          post: review.post,
          createdAt: review.createdAt,
          helpful: 0, // This would need to be added to the backend if needed
        }));
        
        setReviews(transformedReviews);
      } else {
        // Fallback to empty array if API fails
        setReviews([]);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      // Show empty state on error
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = filterRating === "all"
    ? reviews
    : reviews.filter(review => review.rating === parseInt(filterRating));

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleReviewClick = (review) => {
    setSelectedReview(review);
    setShowReviewsModal(true);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className={`min-h-screen ${theme.bg} p-3 sm:p-4 md:p-6`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${theme.textPrimary}`}>My Reviews</h1>
            <p className={`${theme.textSecondary} mt-1 text-sm sm:text-base`}>See what students say about your courses</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg ${theme.cardBg} border ${theme.cardBorder}`}>
              <div className={`text-xs sm:text-sm ${theme.textMuted}`}>Average Rating</div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                <span className={`text-xl sm:text-2xl font-bold ${theme.textPrimary}`}>{averageRating.toFixed(1)}</span>
              </div>
            </div>
            <div className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg ${theme.cardBg} border ${theme.cardBorder}`}>
              <div className={`text-xs sm:text-sm ${theme.textMuted}`}>Total Reviews</div>
              <div className={`text-xl sm:text-2xl font-bold ${theme.textPrimary}`}>{reviews.length}</div>
            </div>
          </div>
        </div>

        {/* Rating Summary */}
        <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-4 sm:p-6 mb-4 sm:mb-6`}>
          <h2 className={`text-base sm:text-lg font-semibold ${theme.textPrimary} mb-3 sm:mb-4`}>Rating Distribution</h2>
          <div className="space-y-2 sm:space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter(r => r.rating === rating).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1 sm:gap-2 w-12 sm:w-16">
                    <span className={`text-sm sm:text-base font-medium ${theme.textPrimary}`}>{rating}</span>
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className={`flex-1 h-2 rounded-full ${theme.hoverBg}`}>
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={`text-xs sm:text-sm ${theme.textSecondary} w-8 sm:w-12 text-right`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Filter className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.textMuted}`} />
            <span className={`text-sm sm:text-base font-medium ${theme.textPrimary}`}>Filter by rating:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "5", "4", "3", "2", "1"].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilterRating(rating)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                  filterRating === rating
                    ? "bg-blue-500 text-white"
                    : `${theme.hoverBg} ${theme.textSecondary} hover:${theme.textPrimary}`
                }`}
              >
                {rating === "all" ? "All" : `${rating} Stars`}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer`}
              onClick={() => handleReviewClick(review)}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <img
                  src={review.reviewer.avatar}
                  alt={review.reviewer.firstName}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className={`text-sm sm:text-base font-semibold ${theme.textPrimary} truncate`}>
                        {review.reviewer.firstName} {review.reviewer.lastName}
                      </h3>
                      <p className={`text-xs sm:text-sm ${theme.textMuted} truncate`}>
                        Reviewed your post
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={`sm:w-4 sm:h-4 ${
                            star <= review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : theme.textMuted
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className={`text-sm sm:text-base ${theme.textSecondary} mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-none`}>{review.comment}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className={`flex items-center gap-1 ${theme.textMuted}`}>
                      <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${theme.textMuted}`}>
                      <ThumbsUp size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>{review.helpful} helpful</span>
                    </div>
                    <div className={`flex items-center gap-1 ${theme.textMuted}`}>
                      <MessageSquare size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>Reply</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className={`text-center py-8 sm:py-12 ${theme.cardBg} rounded-xl`}>
            <Award className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 ${theme.textMuted}`} />
            <h3 className={`text-lg sm:text-xl font-semibold ${theme.textPrimary} mb-2`}>No reviews yet</h3>
            <p className={`text-sm sm:text-base ${theme.textSecondary}`}>Reviews from your students will appear here</p>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      {selectedReview && (
        <ReviewsListModal
          isOpen={showReviewsModal}
          onClose={() => {
            setShowReviewsModal(false);
            setSelectedReview(null);
          }}
          reviews={[selectedReview]}
          loading={false}
          averageRating={selectedReview.rating}
          totalReviews={1}
        />
      )}
    </div>
  );
};

export default Reviews;
