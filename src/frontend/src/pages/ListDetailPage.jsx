import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Heart,
    ArrowLeft,
    Calendar,
    User,
    Star,
    ChevronDown,
    Check,
    ArrowUpDown
} from "lucide-react";
import { getPublicList, toggleListLike } from "../api";
import { useAuth } from "../context/AuthContext";
import ViewToggle from "../components/common/ViewToggle";
import GridGameCard from "../components/game/GridGameCard";
import GameListCard from "../components/common/GameListCard";
import { formatDistanceToNow } from "date-fns";

// Sort options for list detail
const SORT_OPTIONS = [
    { value: "added", label: "Date Added" },
    { value: "name", label: "Name" },
    { value: "rating", label: "Top Rated" }
];

const ListDetailPage = () => {
    const { listId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState(() => localStorage.getItem("listDetailViewMode") || "grid");
    const [sortBy, setSortBy] = useState(() => localStorage.getItem("listDetailSortBy") || "added");
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
    const [liking, setLiking] = useState(false);

    // Persist preferences
    useEffect(() => {
        localStorage.setItem("listDetailViewMode", viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem("listDetailSortBy", sortBy);
    }, [sortBy]);

    useEffect(() => {
        const fetchList = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getPublicList(listId);
                setList(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchList();
    }, [listId]);

    const handleLike = async () => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (liking) return;

        setLiking(true);
        try {
            const result = await toggleListLike(list.id, list.user_liked);
            setList(prev => ({
                ...prev,
                user_liked: result.liked,
                likes_count: result.likes_count
            }));
        } catch (err) {
            console.error("Error toggling like:", err);
        } finally {
            setLiking(false);
        }
    };

    // Sort games
    const sortedGames = useMemo(() => {
        if (!list?.games) return [];

        const games = [...list.games];

        switch (sortBy) {
            case "name":
                return games.sort((a, b) => a.name.localeCompare(b.name));
            case "rating":
                return games.sort((a, b) => {
                    const ratingA = parseFloat(a.rating) || 0;
                    const ratingB = parseFloat(b.rating) || 0;
                    return ratingB - ratingA;
                });
            case "added":
            default:
                return games.sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
        }
    }, [list?.games, sortBy]);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark pt-20 pb-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-gray-800 rounded w-1/2 mb-8"></div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="aspect-[3/4] bg-gray-800 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-dark pt-20 pb-16">
                <div className="max-w-7xl mx-auto px-4">
                    <motion.div
                        className="text-center py-16 px-6 text-gray-400 bg-surface-dark/30 rounded-xl border border-gray-800/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <h4 className="mb-2 font-bold text-lg text-gray-300">List Not Found</h4>
                        <p className="text-sm mb-4">{error}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="text-primary hover:underline"
                        >
                            Go Back
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark pt-20 pb-16">
            <div className="max-w-7xl mx-auto px-4">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm">Back to Lists</span>
                </motion.button>

                {/* List Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <h1 className="text-3xl font-bold text-white mb-2">{list.name}</h1>
                    {list.description && (
                        <p className="text-gray-400 mb-4 max-w-2xl">{list.description}</p>
                    )}

                    {/* Creator & Meta Row - Like button integrated inline */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <Link
                            to={`/profile/${list.creator?.username}`}
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                            <User size={14} />
                            <span>{list.creator?.username || "Unknown"}</span>
                        </Link>

                        <span className="text-gray-600">•</span>

                        <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>Updated {formatDistanceToNow(new Date(list.updated_at), { addSuffix: true })}</span>
                        </div>

                        <span className="text-gray-600">•</span>

                        <span className="text-gray-400">{list.game_count} games</span>

                        <span className="text-gray-600">•</span>

                        {/* Like Button - Inline with meta, matching ReviewItem style */}
                        <button
                            onClick={handleLike}
                            disabled={liking}
                            className={`flex items-center gap-1.5 cursor-pointer transition-colors ${list.user_liked
                                ? "text-primary"
                                : "text-gray-400 hover:text-primary"
                                }`}
                        >
                            <Heart
                                size={14}
                                fill={list.user_liked ? "currentColor" : "none"}
                            />
                            <span>{list.likes_count}</span>
                        </button>
                    </div>
                </motion.div>

                {/* Controls Bar */}
                <motion.div
                    className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* View Toggle */}
                    <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />

                    {/* Sort Dropdown - Styled like SortDropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer ${sortDropdownOpen
                                ? "bg-surface/80 text-white"
                                : "bg-surface/30 text-gray-400 hover:text-white hover:bg-surface/50"
                                } transition-all`}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <span>Sort: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
                            <ChevronDown
                                className={`w-3 h-3 transition-transform ${sortDropdownOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {sortDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-dark rounded-lg shadow-lg z-50 border border-gray-800/50 overflow-hidden">
                                <div className="p-2">
                                    {SORT_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setSortBy(option.value);
                                                setSortDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 rounded text-[13px] flex items-center cursor-pointer ${sortBy === option.value
                                                ? "bg-surface/80 text-white font-semibold"
                                                : "text-gray-400 hover:bg-surface hover:text-white"
                                                } transition-colors`}
                                        >
                                            {sortBy === option.value && (
                                                <Check className="w-3 h-3 mr-1.5 text-primary" />
                                            )}
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Games Grid/List */}
                {sortedGames.length === 0 ? (
                    <motion.div
                        className="text-center py-16 px-6 text-gray-400 bg-surface-dark/30 rounded-xl border border-gray-800/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Star className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <h4 className="mb-2 font-bold text-lg text-gray-300">This list is empty</h4>
                        <p className="text-sm">No games have been added to this list yet.</p>
                    </motion.div>
                ) : (
                    <motion.div
                        className={
                            viewMode === "grid"
                                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5"
                                : "flex flex-col gap-3 max-w-3xl"
                        }
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {sortedGames.map((game, index) => (
                            <motion.div
                                key={game.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                            >
                                {viewMode === "grid" ? (
                                    <GridGameCard game={game} />
                                ) : (
                                    <GameListCard game={game} index={index} />
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ListDetailPage;
