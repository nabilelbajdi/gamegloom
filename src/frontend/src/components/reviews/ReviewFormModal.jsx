// src/components/reviews/ReviewFormModal.jsx
// Single page modal with expandable details section
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, ThumbsUp, ThumbsDown, ChevronDown, Edit } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useReviewStore from "../../store/useReviewStore";

const PLATFORMS = ["PC", "PlayStation 5", "PlayStation 4", "Xbox Series X|S", "Xbox One", "Nintendo Switch", "Steam Deck", "Mobile", "Other"];

const COMPLETION_STATUSES = [
    { value: "main_story", label: "Main Story" },
    { value: "main_extras", label: "Main + Extras" },
    { value: "completionist", label: "100%" },
    { value: "still_playing", label: "Playing" },
    { value: "dropped", label: "Dropped" },
    { value: "endless", label: "Endless" }
];

const CATEGORY_RATINGS = [
    { key: "story_rating", label: "Story" },
    { key: "gameplay_rating", label: "Gameplay" },
    { key: "visuals_rating", label: "Visuals" },
    { key: "audio_rating", label: "Audio" },
    { key: "performance_rating", label: "Performance" }
];

const RATING_LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Great", 5: "Excellent" };

const ReviewFormModal = ({ isOpen, onClose, game, existingReview = null, onSuccess }) => {
    const { user } = useAuth();
    const { addReview, updateReview } = useReviewStore();

    const [showDetails, setShowDetails] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [hoverRating, setHoverRating] = useState(0);

    const [formData, setFormData] = useState({
        rating: 0,
        content: "",
        platform: "",
        playtime_hours: "",
        completion_status: "",
        story_rating: 0,
        gameplay_rating: 0,
        visuals_rating: 0,
        audio_rating: 0,
        performance_rating: 0,
        recommended: null
    });

    // Initialize form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (existingReview) {
                setFormData({
                    rating: existingReview.rating || 0,
                    content: existingReview.content || "",
                    platform: existingReview.platform || "",
                    playtime_hours: existingReview.playtime_hours || "",
                    completion_status: existingReview.completion_status || "",
                    story_rating: existingReview.story_rating || 0,
                    gameplay_rating: existingReview.gameplay_rating || 0,
                    visuals_rating: existingReview.visuals_rating || 0,
                    audio_rating: existingReview.audio_rating || 0,
                    performance_rating: existingReview.performance_rating || 0,
                    recommended: existingReview.recommended ?? null
                });
                // Auto-expand if they have detailed info
                if (existingReview.platform || existingReview.playtime_hours || existingReview.completion_status || existingReview.story_rating) {
                    setShowDetails(true);
                } else {
                    setShowDetails(false);
                }
            } else {
                setFormData({
                    rating: 0, content: "", platform: "", playtime_hours: "",
                    completion_status: "", story_rating: 0, gameplay_rating: 0,
                    visuals_rating: 0, audio_rating: 0, performance_rating: 0, recommended: null
                });
                setShowDetails(false);
            }
            setError(null);
        }
    }, [isOpen, existingReview]);

    // Lock body scroll and ESC key handler
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';

            const handleEscape = (e) => {
                if (e.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleEscape);
            return () => {
                document.body.style.overflow = 'unset';
                document.removeEventListener('keydown', handleEscape);
            };
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen, onClose]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.rating) {
            setError("Please select a rating");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const reviewData = {
                ...formData,
                playtime_hours: formData.playtime_hours ? parseInt(formData.playtime_hours) : null,
                story_rating: formData.story_rating || null,
                gameplay_rating: formData.gameplay_rating || null,
                visuals_rating: formData.visuals_rating || null,
                audio_rating: formData.audio_rating || null,
                performance_rating: formData.performance_rating || null
            };

            if (existingReview) {
                await updateReview(existingReview.id, game.igdb_id, reviewData.rating, reviewData.content, reviewData);
            } else {
                await addReview(game.igdb_id, reviewData.rating, reviewData.content, reviewData);
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.message || "Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !user) return null;

    const handleBackdrop = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return createPortal(
        <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdrop}
        >
            <motion.div
                className="bg-surface-dark rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Edit className="w-5 h-5 text-primary" />
                        {existingReview ? "Edit Review" : "Write Review"}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Rating - Required */}
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">
                            Your Rating <span className="text-red-400">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => handleChange("rating", star)}
                                        className="cursor-pointer transition-transform hover:scale-110"
                                    >
                                        <Star
                                            size={28}
                                            className={star <= (hoverRating || formData.rating)
                                                ? "fill-primary text-primary"
                                                : "fill-gray-600 text-gray-600"}
                                        />
                                    </button>
                                ))}
                            </div>
                            {(formData.rating > 0 || hoverRating > 0) && (
                                <span className="text-sm font-medium text-primary">
                                    {RATING_LABELS[hoverRating || formData.rating]}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Review Text */}
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">Review</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => handleChange("content", e.target.value)}
                            placeholder="Share what you think about this game..."
                            rows={3}
                            maxLength={5000}
                            className="w-full bg-surface text-light rounded-lg px-3 py-2 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none text-sm"
                        />
                    </div>

                    {/* Expandable Details Section */}
                    <div className="border border-gray-700/50 rounded-lg overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className="w-full flex items-center justify-between p-3 bg-surface hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                            <span className="text-sm text-gray-400">
                                Add details (platform, playtime, category ratings...)
                            </span>
                            <ChevronDown
                                size={18}
                                className={`text-gray-400 transition-transform ${showDetails ? "rotate-180" : ""}`}
                            />
                        </button>

                        <AnimatePresence>
                            {showDetails && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 space-y-5 border-t border-gray-700/50">
                                        {/* Platform & Playtime */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-gray-400 mb-1 block">Platform</label>
                                                <select
                                                    value={formData.platform}
                                                    onChange={(e) => handleChange("platform", e.target.value)}
                                                    className="w-full bg-surface-dark text-light text-sm rounded-lg px-3 py-2 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                                >
                                                    <option value="">Select...</option>
                                                    {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400 mb-1 block">Hours played</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.playtime_hours}
                                                    onChange={(e) => handleChange("playtime_hours", e.target.value)}
                                                    placeholder="0"
                                                    className="w-full bg-surface-dark text-light text-sm rounded-lg px-3 py-2 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                        </div>

                                        {/* Completion Status */}
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block">Completion</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {COMPLETION_STATUSES.map((status) => (
                                                    <button
                                                        key={status.value}
                                                        type="button"
                                                        onClick={() => handleChange("completion_status", formData.completion_status === status.value ? "" : status.value)}
                                                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${formData.completion_status === status.value
                                                            ? "bg-primary text-black"
                                                            : "bg-surface-dark text-gray-400 hover:text-light border border-gray-700/50"
                                                            }`}
                                                    >
                                                        {status.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Category Ratings */}
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block">Rate categories</label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {CATEGORY_RATINGS.map((cat) => (
                                                    <div key={cat.key} className="text-center">
                                                        <div className="text-xs text-gray-500 mb-1">{cat.label}</div>
                                                        <div className="flex justify-center gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <button
                                                                    key={star}
                                                                    type="button"
                                                                    onClick={() => handleChange(cat.key, formData[cat.key] === star ? 0 : star)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Star
                                                                        size={12}
                                                                        className={star <= formData[cat.key] ? "fill-primary text-primary" : "fill-gray-600 text-gray-600"}
                                                                    />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Recommend */}
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1.5 block">Would you recommend?</label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleChange("recommended", formData.recommended === true ? null : true)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${formData.recommended === true
                                                        ? "bg-green-600 text-white"
                                                        : "bg-surface-dark text-gray-400 hover:text-light border border-gray-700/50"
                                                        }`}
                                                >
                                                    <ThumbsUp size={14} /> Yes
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleChange("recommended", formData.recommended === false ? null : false)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${formData.recommended === false
                                                        ? "bg-red-600 text-white"
                                                        : "bg-surface-dark text-gray-400 hover:text-light border border-gray-700/50"
                                                        }`}
                                                >
                                                    <ThumbsDown size={14} /> No
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !formData.rating}
                            className="px-4 py-2 bg-primary text-black text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {submitting ? "Saving..." : existingReview ? "Update Review" : "Post Review"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>,
        document.body
    );
};

export default ReviewFormModal;
