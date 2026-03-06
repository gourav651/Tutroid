import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Star, MessageSquare, Download, FileText, Calendar, User } from 'lucide-react';

export default function MaterialRating({ materialId, onRated, userHasAccessed = false }) {
  const { theme } = useTheme();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [existingRating, setExistingRating] = useState(null);

  useEffect(() => {
    checkIfUserHasRated();
  }, [materialId]);

  const checkIfUserHasRated = async () => {
    try {
      const response = await ApiService.getMyMaterialRatings();
      if (response.success) {
        const userRating = response.data.ratings.find(r => r.materialId === materialId);
        if (userRating) {
          setHasRated(true);
          setExistingRating(userRating);
          setRating(userRating.rating);
          setComment(userRating.comment || '');
        }
      }
    } catch (error) {
      console.error('Failed to check rating status:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || submitting) return;

    setSubmitting(true);
    try {
      const response = await ApiService.rateMaterial(materialId, rating, comment);
      if (response.success) {
        setHasRated(true);
        setExistingRating(response.data);
        if (onRated) onRated(response.data);
      }
    } catch (error) {
      console.error('Rating failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (rating === 0 || submitting || !existingRating) return;

    setSubmitting(true);
    try {
      const response = await ApiService.updateMaterialRating(existingRating.id, rating, comment);
      if (response.success) {
        setExistingRating(response.data);
        if (onRated) onRated(response.data);
      }
    } catch (error) {
      console.error('Rating update failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRating) return;

    try {
      await ApiService.deleteMaterialRating(existingRating.id);
      setHasRated(false);
      setExistingRating(null);
      setRating(0);
      setComment('');
      if (onRated) onRated(null);
    } catch (error) {
      console.error('Rating deletion failed:', error);
    }
  };

  if (!userHasAccessed) {
    return (
      <div className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-6 text-center`}>
        <FileText className={`w-12 h-12 ${theme.textMuted} mx-auto mb-3`} />
        <p className={`${theme.textMuted}`}>You must access this material before rating it</p>
      </div>
    );
  }

  if (hasRated && existingRating) {
    return (
      <div className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${theme.textPrimary}`}>Your Rating</h3>
          <button
            onClick={handleDelete}
            className={`text-sm ${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
          >
            Delete Rating
          </button>
        </div>
        
        <form onSubmit={handleUpdate}>
          <div className="mb-4">
            <div className="flex gap-1 mb-2">
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
            <p className={`text-sm ${theme.textMuted}`}>
              Your rating: {rating} out of 5
            </p>
          </div>
          
          <div className="mb-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this material..."
              className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
              rows="3"
            />
          </div>
          
          <button
            type="submit"
            disabled={rating === 0 || submitting}
            className={`w-full py-2 rounded-lg ${theme.accentBg} text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? 'Updating...' : 'Update Rating'}
          </button>
        </form>
        
        <div className={`mt-4 pt-4 border-t ${theme.divider}`}>
          <p className={`text-xs ${theme.textMuted}`}>
            Rated on {new Date(existingRating.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.cardBg} rounded-lg border ${theme.cardBorder} p-6`}>
      <h3 className={`font-semibold ${theme.textPrimary} mb-4`}>Rate This Material</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex gap-1 mb-2">
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
                  className={`w-8 h-8 transition-colors ${
                    star <= (hover || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : theme.textMuted
                  }`}
                />
              </button>
            ))}
          </div>
          <p className={`text-sm ${theme.textMuted}`}>
            {rating === 0 ? 'Click to rate' : `Your rating: ${rating} out of 5`}
          </p>
        </div>
        
        <div className="mb-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this material (optional)..."
            className={`w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
            rows="3"
          />
        </div>
        
        <button
          type="submit"
          disabled={rating === 0 || submitting}
          className={`w-full py-2 rounded-lg ${theme.accentBg} text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
}

export function MaterialCard({ material, trainer, onRate, userHasAccessed = false }) {
  const { theme } = useTheme();
  const [showRating, setShowRating] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    loadRatingStats();
  }, [material.id]);

  const loadRatingStats = async () => {
    try {
      const response = await ApiService.getMaterialRatings(material.id, 1, 1);
      if (response.success) {
        setAverageRating(response.data.stats.averageRating);
        setTotalRatings(response.data.stats.totalRatings);
      }
    } catch (error) {
      console.error('Failed to load rating stats:', error);
    }
  };

  const handleDownload = () => {
    // Mark as accessed and download
    window.open(material.fileUrl, '_blank');
    if (!userHasAccessed && onRate) {
      onRate(material.id, true);
    }
  };

  const handleRatingComplete = (ratingData) => {
    setShowRating(false);
    loadRatingStats(); // Refresh stats
  };

  return (
    <div className={`${theme.cardBg} rounded-xl border ${theme.cardBorder} overflow-hidden`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className={`font-semibold text-lg ${theme.textPrimary} mb-2`}>
              {material.title}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <User className={`w-4 h-4 ${theme.textMuted}`} />
              <span className={theme.textSecondary}>
                {trainer?.user?.email?.split('@')[0] || 'Trainer'}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            {totalRatings > 0 && (
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className={`font-semibold ${theme.textPrimary}`}>
                  {averageRating.toFixed(1)}
                </span>
              </div>
            )}
            <p className={`text-xs ${theme.textMuted}`}>
              {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
            </p>
          </div>
        </div>
        
        {/* Date */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Calendar className={`w-4 h-4 ${theme.textMuted}`} />
          <span className={theme.textMuted}>
            Uploaded {new Date(material.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className={`flex-1 py-2 px-4 rounded-lg ${theme.accentBg} text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          
          {userHasAccessed && (
            <button
              onClick={() => setShowRating(!showRating)}
              className={`flex-1 py-2 px-4 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.textSecondary} hover:${theme.hoverBg} transition-colors flex items-center justify-center gap-2`}
            >
              <Star className="w-4 h-4" />
              {userHasAccessed ? (showRating ? 'Hide Rating' : 'Rate Material') : 'Access to Rate'}
            </button>
          )}
        </div>
        
        {/* Rating Section */}
        {showRating && userHasAccessed && (
          <div className="mt-6">
            <MaterialRating
              materialId={material.id}
              onRated={handleRatingComplete}
              userHasAccessed={userHasAccessed}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function MaterialList({ materials, trainer, onMaterialAccessed }) {
  const { theme } = useTheme();
  const [ratings, setRatings] = useState({});

  const handleRate = (materialId, hasAccessed) => {
    setRatings(prev => ({
      ...prev,
      [materialId]: hasAccessed
    }));
    if (onMaterialAccessed) {
      onMaterialAccessed(materialId, hasAccessed);
    }
  };

  return (
    <div className="space-y-6">
      {materials.map((material) => (
        <MaterialCard
          key={material.id}
          material={material}
          trainer={trainer}
          onRate={handleRate}
          userHasAccessed={ratings[material.id]}
        />
      ))}
    </div>
  );
}
