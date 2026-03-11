import { X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import PostCard from "../assets/components/PostCard";

export default function PostDetailModal({ 
  isOpen, 
  onClose, 
  post,
  user,
  isSaved,
  onSave,
  onShare,
  onDelete,
  onEdit,
  isOwnProfile,
  onReviewUpdate
}) {
  const { theme } = useTheme();

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${theme.cardBg} transition-all duration-300`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`sticky top-4 right-4 float-right z-10 p-2 rounded-full ${theme.cardBg} border ${theme.cardBorder} shadow-lg ${theme.textSecondary} hover:${theme.accentColor} transition-all duration-300`}
        >
          <X size={20} />
        </button>

        {/* Post Content */}
        <div className="clear-both">
          <PostCard
            post={post}
            user={user}
            isSaved={isSaved}
            showComments={false}
            commentInput=""
            onSave={onSave}
            onShare={onShare}
            onComment={() => {}}
            onSubmitComment={() => {}}
            onDelete={onDelete}
            onEdit={onEdit}
            isOwnProfile={isOwnProfile}
            onReviewUpdate={onReviewUpdate}
          />
        </div>
      </div>
    </div>
  );
}
