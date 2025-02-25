import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import useReviewStore from "../../store/useReviewStore";
import { Heart, MessageCircle, ChevronDown, ChevronUp, Pencil, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ReviewItem = ({ review, gameId }) => {
  const [isCommenting, setIsCommenting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(review.content);
  const [editedRating, setEditedRating] = useState(review.rating);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const { user } = useAuth();
  const { toggleLike, addComment, fetchReviewComments, updateReview, deleteReview, deleteComment, updateComment } = useReviewStore();
  const comments = review.comments || [];

  const handleLike = async () => {
    if (!user) return;
    try {
      await toggleLike(review.id, gameId);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    try {
      await addComment(review.id, gameId, commentText);
      setCommentText("");
      setIsCommenting(false);
      await fetchReviewComments(review.id, gameId);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    try {
      await updateReview(review.id, gameId, editedRating, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating review:", error);
    }
  };

  const handleDeleteReview = async () => {
    try {
      await deleteReview(review.id, gameId);
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(review.id, commentId, gameId);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleUpdateComment = async (commentId) => {
    try {
      await updateComment(review.id, commentId, editedCommentText, gameId);
      setEditingCommentId(null);
      setEditedCommentText("");
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const toggleComments = async () => {
    if (!showComments && review.comments_count > 0) {
      try {
        await fetchReviewComments(review.id, gameId);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }
    setShowComments(!showComments);
  };

  return (
    <div className="bg-surface p-4 rounded-lg space-y-4">
      {/* Review Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-lg font-medium text-white">
              {review.user?.username?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <h3 className="font-medium">{review.user?.username || "Anonymous"}</h3>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${
                          star <= review.rating ? "text-primary" : "text-gray-600"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    {review.updated_at !== review.created_at && (
                      <span className="ml-1 italic">(edited {formatDistanceToNow(new Date(review.updated_at), { addSuffix: true })})</span>
                    )}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setEditedRating(star)}
                      className={`text-sm cursor-pointer ${
                        star <= editedRating ? "text-primary" : "text-gray-600"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit/Delete buttons for review owner */}
        {user && user.id === review.user_id && !isEditing && (
          <div className="flex items-center gap-2">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Delete?</span>
                <button
                  onClick={handleDeleteReview}
                  className="px-2 py-1 text-red-700 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-gray-700 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-gray-400 hover:text-red-700 transition-colors rounded-full hover:bg-gray-700 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Review Content */}
      {isEditing ? (
        <form onSubmit={handleUpdateReview} className="space-y-3">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface-hover rounded-lg border border-surface-border focus:outline-none focus:border-primary resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditedContent(review.content);
                setEditedRating(review.rating);
              }}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-primary text-dark rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-300">{review.content}</p>
      )}

      {/* Review Actions */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm cursor-pointer ${
            review.user_liked ? "text-red-700" : "text-gray-400 hover:text-red-700"
          } transition-colors`}
        >
          <Heart className="w-4 h-4" fill={review.user_liked ? "currentColor" : "none"} />
          <span>{review.likes_count}</span>
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{review.comments_count}</span>
          {review.comments_count > 0 && (
            showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="pl-4 border-l border-gray-700 mt-4 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="group space-y-1 p-2 hover:bg-gray-800/50 rounded-lg transition-colors duration-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {comment.user?.username?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{comment.user?.username}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    {comment.updated_at !== comment.created_at && (
                      <span className="ml-1 italic">(edited {formatDistanceToNow(new Date(comment.updated_at), { addSuffix: true })})</span>
                    )}
                  </span>
                </div>
                
                {user && user.id === comment.user_id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {deletingCommentId === comment.id ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Delete?</span>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="px-2 py-1 text-red-700 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingCommentId(null)}
                          className="px-2 py-1 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditedCommentText(comment.content);
                          }}
                          className="p-1 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-surface-hover cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeletingCommentId(comment.id)}
                          className="p-1 text-gray-400 hover:text-red-700 transition-colors rounded-full hover:bg-surface-hover cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {editingCommentId === comment.id ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateComment(comment.id);
                }} className="space-y-2 ml-8">
                  <textarea
                    value={editedCommentText}
                    onChange={(e) => setEditedCommentText(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface-hover rounded-lg border border-surface-border focus:outline-none focus:border-primary resize-none"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditedCommentText("");
                      }}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!editedCommentText.trim()}
                      className="px-3 py-1.5 text-xs bg-primary text-dark rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-gray-300 ml-8">{comment.content}</p>
              )}
            </div>
          ))}
          
          {user && (
            <div className="mt-4">
              {isCommenting ? (
                <form onSubmit={handleComment} className="space-y-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 text-sm bg-surface-hover rounded-lg border border-surface-border focus:outline-none focus:border-primary resize-none"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCommenting(false)}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-3 py-1.5 text-xs bg-primary text-dark rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Post Comment
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsCommenting(true)}
                  className="text-sm text-primary hover:text-primary/90 transition-colors cursor-pointer"
                >
                  Add a comment
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewItem; 