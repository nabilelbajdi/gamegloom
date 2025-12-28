import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, TrendingUp, Clock, Heart, Loader2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getPublicLists, getFeaturedLists, likeList, unlikeList } from "../api";
import ListCard, { ListCardSkeleton } from "../components/lists/ListCard";
import { useAuth } from "../context/AuthContext";
import debounce from "lodash/debounce";

const TABS = [
    { id: "popular", label: "Popular", icon: TrendingUp },
    { id: "recent", label: "Recent", icon: Clock },
    { id: "featured", label: "Featured", icon: Sparkles }
];

// Simple cache for public lists (5 minutes TTL)
const CACHE_DURATION = 5 * 60 * 1000;
const listsCache = {
    data: {},
    timestamps: {},
    featured: null,
    featuredTimestamp: 0
};

const BrowseListsPage = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialLoad = useRef(true);

    // Get initial tab for cache lookup
    const initialTab = searchParams.get("tab") || "popular";
    const initialSearch = searchParams.get("q") || "";
    const initialCacheKey = `${initialTab}:${initialSearch || ''}:1`;
    const hasCachedData = listsCache.data[initialCacheKey] &&
        listsCache.timestamps[initialCacheKey] &&
        (Date.now() - listsCache.timestamps[initialCacheKey]) < CACHE_DURATION;

    // State - initialize from cache if available
    const [lists, setLists] = useState(hasCachedData ? listsCache.data[initialCacheKey].lists : []);
    const [featuredList, setFeaturedList] = useState(listsCache.featured || null);
    const [loading, setLoading] = useState(!hasCachedData);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(hasCachedData ? listsCache.data[initialCacheKey].has_more : false);
    const [total, setTotal] = useState(hasCachedData ? listsCache.data[initialCacheKey].total : 0);

    // Debounced search
    const debouncedSetSearch = useCallback(
        debounce((value) => {
            setDebouncedSearch(value);
            setPage(1);
        }, 400),
        []
    );

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        debouncedSetSearch(value);
    };

    // Cache key for current query
    const getCacheKey = (tab, search, pageNum) => `${tab}:${search || ''}:${pageNum}`;

    // Fetch lists with caching
    const fetchLists = async (pageNum = 1, append = false) => {
        const cacheKey = getCacheKey(activeTab, debouncedSearch, pageNum);
        const cachedData = listsCache.data[cacheKey];
        const cacheTime = listsCache.timestamps[cacheKey];

        // Use cache if available and fresh
        if (!append && pageNum === 1 && cachedData &&
            cacheTime && (Date.now() - cacheTime) < CACHE_DURATION) {
            setLists(cachedData.lists);
            setHasMore(cachedData.has_more);
            setTotal(cachedData.total);
            setPage(pageNum);
            setLoading(false);
            return;
        }

        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const data = await getPublicLists(pageNum, 16, activeTab, debouncedSearch || undefined);

            if (append) {
                setLists(prev => [...prev, ...data.lists]);
            } else {
                setLists(data.lists);
                // Cache first page results
                if (pageNum === 1) {
                    listsCache.data[cacheKey] = data;
                    listsCache.timestamps[cacheKey] = Date.now();
                }
            }

            setHasMore(data.has_more);
            setTotal(data.total);
            setPage(pageNum);
        } catch (error) {
            console.error("Error fetching lists:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Fetch featured list for hero with caching
    const fetchFeaturedList = async () => {
        // Use cache if fresh
        if (listsCache.featured && (Date.now() - listsCache.featuredTimestamp) < CACHE_DURATION) {
            setFeaturedList(listsCache.featured);
            return;
        }

        try {
            const featured = await getFeaturedLists(1);
            if (featured.length > 0) {
                setFeaturedList(featured[0]);
                listsCache.featured = featured[0];
                listsCache.featuredTimestamp = Date.now();
            }
        } catch (error) {
            console.error("Error fetching featured list:", error);
        }
    };

    // Initial load
    useEffect(() => {
        fetchFeaturedList();
    }, []);

    // Fetch on tab or search change
    useEffect(() => {
        fetchLists(1, false);

        // Update URL params
        const params = new URLSearchParams();
        if (activeTab !== "popular") params.set("tab", activeTab);
        if (debouncedSearch) params.set("q", debouncedSearch);
        setSearchParams(params, { replace: true });
    }, [activeTab, debouncedSearch]);

    // Load more
    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchLists(page + 1, true);
        }
    };

    // Infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                loadMore();
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [page, hasMore, loadingMore]);

    // Handle like
    const handleLike = async (listId, currentlyLiked) => {
        if (!user) return;

        try {
            if (currentlyLiked) {
                await unlikeList(listId);
            } else {
                await likeList(listId);
            }

            // Update local state
            setLists(prev => prev.map(list => {
                if (list.id === listId) {
                    return {
                        ...list,
                        user_liked: !currentlyLiked,
                        likes_count: currentlyLiked ? list.likes_count - 1 : list.likes_count + 1
                    };
                }
                return list;
            }));
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    // Handle tab change
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-dark pt-20 pb-16">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl font-bold text-white mb-2">Browse Lists</h1>
                    <p className="text-gray-400">
                        Discover curated game collections from the community
                    </p>
                </motion.div>

                {/* Featured Hero */}
                {featuredList && !debouncedSearch && activeTab === "popular" && (
                    <motion.div
                        className="mb-8 rounded-2xl overflow-hidden relative h-48 md:h-64 group cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate(`/lists/${featuredList.id}`)}
                    >
                        {/* Background - upscale cover image for better quality */}
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${featuredList.games?.[0]?.coverImage?.replace('t_cover_big', 't_1080p').replace('t_thumb', 't_1080p') ||
                                    "/images/placeholder-cover.jpg"
                                    })`,
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent" />

                        {/* Content */}
                        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-xs text-primary font-semibold uppercase tracking-wide">Featured List</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                                {featuredList.name}
                            </h2>
                            {featuredList.description && (
                                <p className="text-gray-300 text-sm md:text-base line-clamp-2 max-w-xl mb-3">
                                    {featuredList.description}
                                </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>by {featuredList.creator?.username}</span>
                                <span>{featuredList.game_count || featuredList.games?.length} games</span>
                                <span className="flex items-center gap-1">
                                    <Heart size={14} className={featuredList.user_liked ? "fill-red-500 text-red-500" : ""} />
                                    {featuredList.likes_count}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tabs and Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-surface/30 rounded-lg p-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${activeTab === tab.id
                                    ? "bg-primary text-dark"
                                    : "text-gray-400 hover:text-white hover:bg-surface/50"
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search lists..."
                            className="w-full pl-10 pr-4 py-2 bg-surface/30 border border-gray-800/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Results count */}
                {!loading && (
                    <p className="text-sm text-gray-500 mb-4">
                        {debouncedSearch ? `Found ${total} lists for "${debouncedSearch}"` : `${total} lists`}
                    </p>
                )}

                {/* Lists Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {[...Array(8)].map((_, i) => (
                            <ListCardSkeleton key={i} />
                        ))}
                    </div>
                ) : lists.length === 0 ? (
                    <motion.div
                        className="text-center py-20 px-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-16 h-16 rounded-full bg-surface/50 flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                            {debouncedSearch ? "No lists found" : "No lists yet"}
                        </h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                            {debouncedSearch
                                ? "Try a different search term or browse all lists"
                                : "Be the first to create a public list!"}
                        </p>
                    </motion.div>
                ) : (
                    <>
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {lists.map(list => (
                                <ListCard
                                    key={list.id}
                                    list={list}
                                    onLike={handleLike}
                                />
                            ))}
                        </motion.div>

                        {/* Loading more indicator */}
                        {loadingMore && (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        )}

                        {/* End of results */}
                        {!hasMore && lists.length > 0 && (
                            <p className="text-center text-gray-600 text-sm py-8">
                                You've reached the end
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default BrowseListsPage;
