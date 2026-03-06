import React, { useState } from "react";
import { X, Star } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const ReviewModal = ({ isOpen, onClose, onSubmit, existingReview = null }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState(existingReview?.review || "");
  const [submitting, setSubmitting] = useState(false);
  const { theme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(rating, review);
      onClose();
    } catch (error) {
      alert(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md ${theme.cardBg} rounded-xl shadow-2xl z-50 border ${theme.cardBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${theme.cardBorder} flex items-center justify-between`}>
          <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>
            {existingReview ? "Update Review" : "Rate this Post"}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.hoverBg} transition`}
          >
            <X className={`w-5 h-5 ${theme.textSecondary}`} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Star Rating */}
          <div>
            <label className={`block text-sm font-semibold ${theme.textPrimary} mb-3`}>
              Your Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : `${theme.textMuted}`
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className={`ml-2 text-lg font-semibold ${theme.textPrimary}`}>
                  {rating}.0
                </span>
              )}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className={`block text-sm font-semibold ${theme.textPrimary} mb-2`}>
              Your Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this post..."
              rows={4}
              className={`w-full px-4 py-3 ${theme.inputBg} border ${theme.inputBorder} rounded-lg ${theme.inputText} ${theme.inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 border ${theme.cardBorder} rounded-lg ${theme.textSecondary} ${theme.hoverBg} font-medium transition`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition shadow-lg"
            >
              {submitting ? "Submitting..." : existingReview ? "Update" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ReviewModal;
