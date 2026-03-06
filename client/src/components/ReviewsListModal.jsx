import { X, Star, Loader, MessageSquare } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { formatDistanceToNow } from "../utils/dateUtils";

const ReviewsListModal = ({ 
  isOpen, 
  onClose, 
  reviews, 
  loading, 
  averageRating, 
  totalReviews,
  onAddReview 
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(r => r.rating === rating).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { rating, count, percentage };
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] ${theme.cardBg} rounded-xl shadow-2xl z-50 border ${theme.cardBorder} flex flex-col mx-3 sm:mx-0`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${theme.cardBorder} flex items-center justify-between flex-shrink-0`}>
          <div>
            <h2 className={`text-base sm:text-lg font-semibold ${theme.textPrimary}`}>
              Reviews & Ratings
            </h2>
            <p className={`text-xs sm:text-sm ${theme.textMuted} mt-0.5`}>
              {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 sm:p-2 rounded-lg ${theme.hoverBg} transition`}
          >
            <X className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.textSecondary}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className={`w-8 h-8 animate-spin ${theme.textMuted}`} />
            </div>
          ) : (
            <>
              {/* Rating Summary */}
              <div className={`p-4 sm:p-6 border-b ${theme.cardBorder}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
                  {/* Average Rating */}
                  <div className="text-center sm:flex-shrink-0">
                    <div className={`text-4xl sm:text-5xl font-bold ${theme.textPrimary} mb-2`}>
                      {totalReviews > 0 ? averageRating.toFixed(1) : '0.0'}
                    </div>
                    <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            star <= Math.round(averageRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : `${theme.textMuted}`
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs sm:text-sm ${theme.textMuted}`}>
                      {totalReviews} rating{totalReviews !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Rating Distribution */}
                  <div className="flex-1">
                    {totalReviews > 0 ? (
                      ratingDistribution.map(({ rating, count, percentage }) => (
                        <div key={rating} className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                          <div className="flex items-center gap-1 w-10 sm:w-12">
                            <span className={`text-xs sm:text-sm ${theme.textSecondary}`}>{rating}</span>
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          </div>
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className={`text-xs sm:text-sm ${theme.textMuted} w-6 sm:w-8 text-right`}>
                            {count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className={`text-center py-3 sm:py-4 ${theme.textMuted}`}>
                        <p className="text-xs sm:text-sm">No ratings yet</p>
                        <p className="text-[10px] sm:text-xs mt-1">Be the first to rate!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Review Button */}
                <button
                  onClick={onAddReview}
                  className="w-full mt-3 sm:mt-4 py-2 sm:py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base font-medium transition shadow-lg"
                >
                  {totalReviews > 0 ? 'Write a Review' : 'Be the First to Review'}
                </button>
              </div>

              {/* Reviews List */}
              <div className="p-4 sm:p-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <MessageSquare className={`w-10 h-10 sm:w-12 sm:h-12 ${theme.textMuted} mx-auto mb-2 sm:mb-3 opacity-50`} />
                    <p className={`text-sm sm:text-base ${theme.textMuted}`}>No reviews yet</p>
                    <p className={`text-xs sm:text-sm ${theme.textMuted} mt-1`}>Be the first to review!</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className={`p-3 sm:p-4 ${theme.inputBg} rounded-lg border ${theme.cardBorder}`}
                      >
                        {/* Reviewer Info */}
                        <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                            {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`font-semibold text-xs sm:text-sm ${theme.textPrimary} truncate`}>
                                {review.user?.firstName} {review.user?.lastName}
                              </h4>
                              <span className={`text-[10px] sm:text-xs ${theme.textMuted} flex-shrink-0 ml-2`}>
                                {formatDistanceToNow(review.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                    star <= review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : `${theme.textMuted}`
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Review Text */}
                        {review.review && (
                          <p className={`text-xs sm:text-sm ${theme.textSecondary} leading-relaxed`}>
                            {review.review}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ReviewsListModal;
