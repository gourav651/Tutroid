import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  ThumbsUp,
  User,
  Send,
  FileText,
  Edit,
  Trash2,
  Globe,
  Star,
  X,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import ReviewModal from "../../components/ReviewModal";
import ReviewsListModal from "../../components/ReviewsListModal";
import ApiService from "../../services/api";
import { DEFAULT_PROFILE_IMAGE } from "../../utils/constants";

export default function PostCard({
  post,
  user,
  // isLiked, // Unused
  isSaved,
  showComments,
  commentInput,
  // onLike, // Unused
  onSave,
  onShare,
  onComment,
  onSubmitComment,
  // onToggleComments, // Unused
  onDelete,
  onEdit,
  isOwnProfile = false,
  onReviewUpdate,
  onPostClick,
}) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [userReview] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [shareMenuPosition, setShareMenuPosition] = useState({ bottom: 0, left: 0 });
  const shareMenuRef = useRef(null);

  // Update share menu position when it opens
  useEffect(() => {
    if (showShareMenu && shareMenuRef.current) {
      const rect = shareMenuRef.current.getBoundingClientRect();
      setShareMenuPosition({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left + rect.width / 2
      });
    }
  }, [showShareMenu]);

  const handleReviewSubmit = async (rating, review) => {
    try {
      const response = await ApiService.reviewPost(post.id, rating, review);
      
      // Optimistically update the post data without full refresh
      if (response.success && response.data) {
        const { averageRating, totalReviews } = response.data;
        // Update parent component's post data
        onReviewUpdate?.(post.id, { averageRating, totalReviews });
        
        // Dispatch custom event to notify Reviews page
        window.dispatchEvent(new CustomEvent("reviewAdded"));
      }
        
      // Reload reviews if modal is open
      if (showReviewsModal) {
        loadReviews();
      }
    } catch (error) {
      throw error;
    }
  };

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await ApiService.getPostReviews(post.id);
      setAllReviews(response.data || []);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleShowReviews = () => {
    setShowReviewsModal(true);
    loadReviews();
  };

  const handleShare = async (method) => {
    // Create a URL that points to the author's profile with the specific post ID
    const authorRole = post.author?.role?.toLowerCase() || 'student';
    // Map role to route path (institution -> institute)
    const routePath = authorRole === 'institution' ? 'institute' : authorRole;
    const authorUsername = post.author?.username || post.author?.id;
    const profileUrl = `${window.location.origin}/${routePath}/profile/${authorUsername}?post=${post.id}`;
    const shareText = `Check out this post by ${authorName}: ${post.content?.substring(0, 100)}${post.content?.length > 100 ? '...' : ''}`;

    try {
      if (method === 'copy') {
        await navigator.clipboard.writeText(profileUrl);
        setShareSuccess(true);
        setTimeout(() => {
          setShareSuccess(false);
          setShowShareMenu(false);
        }, 2000);
      } else if (method === 'native' && navigator.share) {
        await navigator.share({
          title: `Post by ${authorName}`,
          text: shareText,
          url: profileUrl,
        });
        setShowShareMenu(false);
      } else if (method === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`, '_blank');
        setShowShareMenu(false);
      } else if (method === 'linkedin') {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`, '_blank');
        setShowShareMenu(false);
      } else if (method === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + profileUrl)}`, '_blank');
        setShowShareMenu(false);
      }
      
      // Call the parent's onShare if provided
      onShare?.();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const truncateContent = (content, maxLength = 280) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

  const getAuthorName = () => {
    if (!post.author) return "Anonymous";
    if (post.author.firstName) {
      return `${post.author.firstName} ${post.author.lastName || ""}`.trim();
    }
    if (post.author.institutionProfile?.name) return post.author.institutionProfile.name;
    if (post.author.name) return post.author.name;
    if (post.author.email) return post.author.email.split("@")[0];
    return "Anonymous";
  };

  const handleAuthorClick = () => {
    if (!post.author?.username) return;
    
    const role = post.author.role?.toLowerCase();
    const rolePath = role === "institution" ? "institute" : role;
    navigate(`/${rolePath}/profile/${post.author.username}`);
  };

  const getAuthorRole = () => {
    if (!post.author) return "Member";
    if (post.author.role === "TRAINER") return "Trainer";
    if (post.author.role === "INSTITUTION") return "Institution";
    if (post.author.trainerProfile?.bio) return "Expert Trainer";
    if (post.author.title) return post.author.title;
    return post.author.role || "Member";
  };

  const authorName = getAuthorName();
  const authorInitial = authorName.charAt(0).toUpperCase();
  const authorAvatar = post.author?.profilePicture || post.author?.avatar || DEFAULT_PROFILE_IMAGE;
  const [imageError, setImageError] = useState(false);

  // Check if post is a PDF - check mimetype and URL patterns
  const isPDF = post.mimetype === "application/pdf" ||
                post.fileType === "pdf" ||
                post.imageUrl?.toLowerCase().endsWith(".pdf") ||
                post.imageUrl?.toLowerCase().includes(".pdf?") ||
                post.imageUrl?.toLowerCase().includes(".pdf#") ||
                post.imageUrl?.toLowerCase().includes("/raw/upload/") || // Cloudinary raw PDFs
                post.imageUrl?.toLowerCase().match(/\.(pdf)(\?|$|#|\/)/i);
  return (
    <>
      <div 
        className={`${theme.cardBg} rounded-xl shadow-sm border ${theme.cardBorder} overflow-hidden hover:shadow-md transition-all duration-200 relative ${onPostClick ? 'cursor-pointer' : ''}`}
        onClick={(e) => {
          // Only trigger if clicking on the card itself, not on buttons or interactive elements
          if (
            onPostClick &&
            !e.target.closest('button') &&
            !e.target.closest('a') &&
            !e.target.closest('input')
          ) {
            onPostClick(post);
          }
        }}
      >
        {/* Rating Badge - Top Right */}
        {(post.averageRating > 0 || post.totalReviews > 0) && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
            <button 
              onClick={handleShowReviews}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg flex items-center gap-1 sm:gap-1.5 hover:scale-105 transition-transform cursor-pointer text-xs sm:text-sm"
            >
              <Star className="w-3 sm:w-4 h-3 sm:h-4 fill-current" />
              <span className="font-bold text-xs sm:text-sm">
                {post.averageRating > 0 ? post.averageRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-[10px] sm:text-xs opacity-90">({post.totalReviews || 0})</span>
            </button>
          </div>
        )}
      {/* Post Header */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Avatar - Clickable */}
            <div 
              onClick={handleAuthorClick}
              className="w-9 sm:w-11 h-9 sm:h-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            >
              {authorAvatar && !imageError ? (
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Failed to load avatar:', authorAvatar);
                    setImageError(true);
                  }}
                />
              ) : (
                <span className="text-white font-bold text-xs sm:text-sm">{authorInitial}</span>
              )}
            </div>

            {/* Author Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <h3 
                  onClick={handleAuthorClick}
                  className={`font-semibold text-xs sm:text-sm ${theme.textPrimary} hover:${theme.accentColor} cursor-pointer transition-colors truncate`}
                >
                  {authorName}
                </h3>
                {post.author?.role === "TRAINER" && (
                  <span className="text-[10px] sm:text-xs bg-blue-500/10 text-blue-500 px-1 sm:px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                    Trainer
                  </span>
                )}
              </div>
              <div className={`flex items-center gap-1 text-[10px] sm:text-xs ${theme.textMuted} mt-0.5 flex-wrap`}>
                <span className="truncate">{getAuthorRole()}</span>
                <span className="hidden sm:inline">·</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
                <span className="hidden sm:inline">·</span>
                <Globe size={10} className="hidden sm:inline" />
              </div>
            </div>
          </div>

          {/* More Options - Only show for own posts */}
          {isOwnProfile && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`p-1 sm:p-1.5 rounded-full ${theme.hoverBg} ${theme.textMuted} ${theme.hoverText} transition-colors`}
              >
                <MoreHorizontal size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              {showDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDropdown(false)}
                  />
                  
                  <div className={`absolute right-0 mt-1 w-40 sm:w-44 ${theme.cardBg} rounded-xl shadow-xl border ${theme.cardBorder} overflow-hidden z-20`}>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this post?")) {
                          onDelete?.(post.id);
                        }
                        setShowDropdown(false);
                      }}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete Post
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-3 sm:px-4 pb-2 sm:pb-3">
        <div className={`text-xs sm:text-sm ${theme.textSecondary} leading-relaxed`}>
          {isExpanded || (post.content?.length || 0) <= 280 ? (
            <div className="whitespace-pre-wrap">{post.content}</div>
          ) : (
            <div>
              <div className="whitespace-pre-wrap">{truncateContent(post.content)}</div>
              <button
                onClick={() => setIsExpanded(true)}
                className={`${theme.accentColor} text-[10px] sm:text-xs font-medium mt-1 hover:underline`}
              >
                ...see more
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Image or PDF */}
      {post.imageUrl && (
        <div className="px-3 sm:px-4 pb-2 sm:pb-3">
          {isPDF ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Use backend proxy to download the file
                const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
                const downloadUrl = `${BACKEND_URL}/api/v1/proxy/download?url=${encodeURIComponent(post.imageUrl)}`;
                
                // Open in new window to trigger download
                window.open(downloadUrl, '_blank');
              }}
              className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 ${theme.hoverBg} rounded-xl border ${theme.cardBorder} transition-colors group`}
            >
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className={`font-medium text-xs sm:text-sm ${theme.textPrimary}`}>PDF Document</p>
                <p className={`text-[10px] sm:text-xs ${theme.accentColor} group-hover:underline`}>Click to download</p>
              </div>
            </a>
          ) : (
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full rounded-xl object-cover max-h-96 cursor-pointer hover:opacity-95 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(true);
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>
      )}

      {/* Image Modal - Larger View */}
      {showImageModal && !isPDF && post.imageUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          onClick={() => setShowImageModal(false)}
        >
          {/* Modal Container */}
          <div 
            className="relative bg-gray-900 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '65vw',
              height: '70vh',
              maxWidth: '1100px',
              maxHeight: '800px',
              minWidth: '500px',
              minHeight: '400px'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-white hover:bg-gray-100 shadow-xl text-gray-700 hover:text-gray-900 transition-all duration-200 z-20"
            >
              <X size={24} />
            </button>

            {/* Image */}
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full h-full object-contain rounded-xl p-4"
            />
          </div>
        </div>
      )}

      {/* Engagement Stats */}
      {(post.averageRating > 0 || post.totalReviews > 0 || post.shares > 0) && (
        <div className={`px-3 sm:px-4 py-2 border-t ${theme.divider} flex items-center justify-between text-[10px] sm:text-xs`}>
          <div className={`flex items-center gap-2 sm:gap-3 ${theme.textMuted}`}>
            {post.averageRating > 0 && (
              <button onClick={handleShowReviews} className="flex items-center gap-1 hover:underline">
                <Star className="w-3 sm:w-4 h-3 sm:h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{post.averageRating.toFixed(1)}</span>
              </button>
            )}
          </div>
          <div className={`flex items-center gap-2 sm:gap-3 ${theme.textMuted}`}>
            {post.totalReviews > 0 && (
              <button onClick={handleShowReviews} className="hover:underline">
                {post.totalReviews} review{post.totalReviews !== 1 ? 's' : ''}
              </button>
            )}
            {post.shares > 0 && (
              <span>{post.shares} shares</span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={`px-2 sm:px-2 py-1 border-t ${theme.divider}`}>
        <div className="flex items-center justify-around">
          <button
            onClick={() => setShowReviewModal(true)}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm font-medium group ${theme.textSecondary} ${theme.hoverBg} ${theme.hoverText}`}
          >
            <Star className={`w-3 sm:w-4 h-3 sm:h-4 transition-transform group-hover:scale-110`} />
            <span className="hidden sm:inline">Rate</span>
          </button>

          <div className="relative" ref={shareMenuRef}>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                shareSuccess 
                  ? 'text-green-500 bg-green-500/10' 
                  : `${theme.textSecondary} ${theme.hoverBg} ${theme.hoverText}`
              } group`}
            >
              <Share2 className="w-3 sm:w-4 h-3 sm:h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">{shareSuccess ? 'Copied!' : 'Share'}</span>
            </button>

            {/* Share Menu */}
            {showShareMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowShareMenu(false)}
                />
                
                {/* Menu - positioned fixed to avoid clipping */}
                <div 
                  className={`fixed z-50 w-48 ${theme.cardBg} rounded-lg shadow-xl border ${theme.cardBorder} py-2 max-h-60 overflow-y-auto`}
                  style={{
                    bottom: shareMenuPosition.bottom,
                    left: shareMenuPosition.left,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <button
                    onClick={() => handleShare('copy')}
                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm font-medium ${theme.textPrimary} ${theme.hoverBg} transition-colors border-b ${theme.cardBorder}`}
                  >
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-blue-500">Copy Link</span>
                  </button>

                  {navigator.share && (
                    <button
                      onClick={() => handleShare('native')}
                      className={`w-full px-4 py-2 text-left flex items-center gap-3 text-xs sm:text-sm ${theme.textPrimary} ${theme.hoverBg} transition-colors`}
                    >
                      <Share2 size={16} />
                      Share via...
                    </button>
                  )}

                  <div className={`h-px ${theme.cardBorder} my-1`} />

                  <button
                    onClick={() => handleShare('whatsapp')}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 text-xs sm:text-sm ${theme.textPrimary} ${theme.hoverBg} transition-colors`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </button>

                  <button
                    onClick={() => handleShare('twitter')}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 text-xs sm:text-sm ${theme.textPrimary} ${theme.hoverBg} transition-colors`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    Twitter
                  </button>

                  <button
                    onClick={() => handleShare('linkedin')}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 text-xs sm:text-sm ${theme.textPrimary} ${theme.hoverBg} transition-colors`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className={`border-t ${theme.divider}`}>
          {/* Comment Input */}
          <div className="p-2 sm:p-3">
            <div className="flex gap-2">
              <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px] sm:text-xs">
                {user?.name?.charAt(0) || user?.firstName?.charAt(0) || "U"}
              </div>

              <div className="flex-1 flex gap-1 sm:gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => onComment?.(e.target.value)}
                  placeholder="Write a comment..."
                  className={`flex-1 ${theme.inputBg} border ${theme.inputBorder} rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-400/30 ${theme.inputText} ${theme.inputPlaceholder} transition-all`}
                  onKeyDown={(e) => e.key === "Enter" && onSubmitComment?.()}
                />
                <button
                  onClick={onSubmitComment}
                  disabled={!commentInput?.trim()}
                  className={`${theme.accentColor} disabled:opacity-40 hover:opacity-80 transition-opacity`}
                >
                  <Send className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Existing Comments */}
          {post.comments && post.comments.length > 0 && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
              {post.comments.slice(0, 3).map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px] sm:text-xs">
                    {(comment.author?.name || comment.author?.firstName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`${theme.hoverBg} rounded-xl px-2 sm:px-3 py-1.5 sm:py-2.5`}>
                      <span className={`font-semibold text-[10px] sm:text-xs ${theme.textPrimary}`}>
                        {comment.author?.name || comment.author?.firstName || "Anonymous"}
                      </span>
                      <p className={`text-xs sm:text-sm ${theme.textSecondary} mt-0.5`}>{comment.content}</p>
                    </div>
                    <div className={`flex items-center gap-2 sm:gap-3 mt-1 ml-2 sm:ml-3 text-[10px] sm:text-xs ${theme.textMuted}`}>
                      <span>{formatTimeAgo(comment.createdAt)}</span>
                      <button className={`hover:${theme.accentColor} transition-colors font-medium`}>Like</button>
                      <button className={`hover:${theme.accentColor} transition-colors font-medium`}>Reply</button>
                    </div>
                  </div>
                </div>
              ))}
              {post.comments.length > 3 && (
                <button className={`text-xs sm:text-sm font-medium ${theme.accentColor} hover:underline ml-8 sm:ml-10`}>
                  View all {post.comments.length} comments
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>

    {/* Review Modal */}
    <ReviewModal
      isOpen={showReviewModal}
      onClose={() => setShowReviewModal(false)}
      onSubmit={handleReviewSubmit}
      existingReview={userReview}
    />

    {/* Reviews List Modal */}
    <ReviewsListModal
      isOpen={showReviewsModal}
      onClose={() => setShowReviewsModal(false)}
      reviews={allReviews}
      loading={loadingReviews}
      averageRating={post.averageRating}
      totalReviews={post.totalReviews}
      onAddReview={() => {
        setShowReviewsModal(false);
        setShowReviewModal(true);
      }}
    />
  </>
  );
}
