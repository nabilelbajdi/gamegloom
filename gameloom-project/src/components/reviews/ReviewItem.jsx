import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import useReviewStore from "../../store/useReviewStore";
import { Heart, MessageCircle, ChevronDown, ChevronUp, Pencil, Trash2, X, Calendar, MoreHorizontal } from "lucide-react";
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
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasMoreLines, setHasMoreLines] = useState(false);
  const contentRef = useRef(null);
  const { user } = useAuth();
  const { toggleLike, addComment, fetchReviewComments, updateReview, deleteReview, deleteComment, updateComment } = useReviewStore();
  const comments = review.comments || [];

  useEffect(() => {
    setEditedRating(review.rating);
  }, [review.rating]);

  useEffect(() => {
    const checkLines = () => {
      const element = contentRef.current;
      if (!element) return;

      element.style.height = "auto";
      const style = window.getComputedStyle(element);
      const lineHeight = parseInt(style.lineHeight);
      const height = element.scrollHeight;
      
      setHasMoreLines(height > lineHeight * 3);
    };

    const timer = setTimeout(checkLines, 0);

    window.addEventListener("resize", checkLines);
    return () => {
      window.removeEventListener("resize", checkLines);
      clearTimeout(timer);
    };
  }, [review.content, isEditing]);

  const isReviewEdited = () => {
    const createdAt = new Date(review.created_at).getTime();
    const updatedAt = new Date(review.updated_at).getTime();
    return Math.abs(updatedAt - createdAt) > 1000;
  };

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
      const contentToSubmit = editedContent?.trim() || "";
      await updateReview(review.id, gameId, editedRating, contentToSubmit);
      setIsEditing(false);
      setIsExpanded(false);
      setHasMoreLines(false);
    } catch (error) {
      console.error("Error updating review:", error);
    }
  };

  const handleDeleteReview = async () => {
    try {
      await deleteReview(review.id, gameId);
      setShowDeleteConfirm(false);
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
    <div className="bg-[#1a1b1e] p-6 rounded-lg space-y-4 border border-gray-800/50 shadow-lg">
      {/* Review Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
            {review.user?.avatar ? (
              <img 
                src={review.user.avatar} 
                alt={`${review.user?.username}'s avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/images/default-avatar.svg";
                }}
              />
            ) : (
              <span className="text-xl font-medium text-white">
                {review.user?.username?.[0]?.toUpperCase() || "?"}
              </span>
            )}
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
                </>
              ) : (
                <div className="flex items-center">
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
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-300 transition-colors rounded-full hover:bg-gray-800/50 cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showActionsMenu && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-[#1a1b1e] rounded-lg shadow-lg border border-gray-800/50 overflow-hidden z-10">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}

            {showDeleteConfirm && (
              <div className="absolute top-full right-0 mt-1 p-3 w-48 bg-[#1a1b1e] rounded-lg shadow-lg border border-gray-800/50 z-10">
                <p className="text-sm text-gray-400 mb-2">Delete this review?</p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteReview}
                    className="px-2 py-1 text-xs text-red-700 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
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
            className="w-full px-3 py-2 text-sm bg-white text-gray-700 placeholder-gray-500 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
            rows={3}
            placeholder="What did you think about this game?"
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
        <div>
          {review.content && review.content.trim().length > 0 ? (
            <>
              <p
                ref={contentRef}
                className={`text-sm text-gray-300 ${!isExpanded ? "line-clamp-3" : ""}`}
              >
                {review.content}
              </p>
              {hasMoreLines && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-xs text-primary hover:text-primary/90 transition-colors cursor-pointer"
                >
                  {isExpanded ? "Show Less" : "Show More"}
                </button>
              )}
            </>
          ) : (
            <div className="h-3"></div>
          )}
        </div>
      )}

      {/* Review Actions */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-700/50">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>
            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            {isReviewEdited() && (
              <span className="ml-1 italic text-gray-500">(edited {formatDistanceToNow(new Date(review.updated_at), { addSuffix: true })})</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm cursor-pointer ${
              review.user_liked ? "text-primary" : "text-gray-400 hover:text-primary"
            } transition-colors`}
          >
            <Heart className="w-3.5 h-3.5" fill={review.user_liked ? "currentColor" : "none"} />
            <span>{review.likes_count}</span>
          </button>
          <button
            onClick={toggleComments}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{review.comments_count}</span>
            {review.comments_count > 0 && (
              showComments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="pl-4 border-l border-gray-700/50 mt-4 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="group space-y-1 p-3 bg-surface/50 hover:bg-surface-hover rounded-lg transition-colors duration-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    {comment.user?.avatar ? (
                      <img 
                        src={comment.user.avatar} 
                        alt={`${comment.user?.username}'s avatar`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/images/default-avatar.svg";
                        }}
                      />
                    ) : (
                      <span className="text-xs font-medium text-white">
                        {comment.user?.username?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
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
                    className="w-full px-3 py-2 text-sm bg-white text-gray-700 placeholder-gray-500 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
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
                    className="w-full px-3 py-2 text-sm bg-white text-gray-700 placeholder-gray-500 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
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