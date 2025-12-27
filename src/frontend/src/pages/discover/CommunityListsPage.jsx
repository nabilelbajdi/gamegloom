import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, ChevronRight, Sparkles, Users } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { getPublicLists, getFeaturedLists } from "../../api";
import SortDropdown from "../../components/common/SortDropdown";
import SearchInput from "../../components/common/SearchInput";

// Sort options for community lists
const LIST_SORT_OPTIONS = [
    { value: "popular", label: "Most Popular" },
    { value: "recent", label: "Recently Updated" },
    { value: "featured", label: "Featured" }
];

// Public List Card Component - matches ListCard.jsx styling
const PublicListCard = ({ list }) => {
    const navigate = useNavigate();
    const [hoveredGameId, setHoveredGameId] = useState(null);
    const displayGames = list.games?.slice(0, 3) || [];

    const handleGameClick = (e, gameId) => {
        e.stopPropagation();
        navigate(`/game/${gameId}`);
    };

    return (
        <motion.div
            className="relative w-full rounded-xl overflow-hidden bg-dark border border-gray-800/30 transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-black/30 group cursor-pointer"
            initial={{ scale: 1 }}
            onClick={() => navigate(`/lists/${list.id}`)}
        >
            {/* Covers Collage - Same as ListCard.jsx */}
            <div
                className="relative h-[180px] bg-gray-900/50 overflow-hidden"
                onMouseLeave={() => setHoveredGameId(null)}
            >
                {displayGames.length > 0 ? (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-500"
                            style={{
                                backgroundImage: `url(${displayGames[0].coverImage || "/images/placeholder-cover.jpg"})`,
                                filter: 'blur(6px)',
                                transform: 'scale(1.1)'
                            }}
                        />
                        <div className="absolute inset-0 bg-black/40"></div>

                        {displayGames.length === 1 ? (
                            <motion.div
                                className="absolute w-[45%] h-[150px] top-4 left-[27.5%] z-10 rounded-md overflow-hidden shadow-lg"
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                onClick={(e) => handleGameClick(e, displayGames[0].igdb_id || displayGames[0].id)}
                                onMouseEnter={() => setHoveredGameId(displayGames[0].id)}
                            >
                                <img
                                    src={displayGames[0].coverImage || "/images/placeholder-cover.jpg"}
                                    alt={displayGames[0].name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                            </motion.div>
                        ) : displayGames.length === 2 ? (
                            <>
                                <motion.div
                                    className="absolute w-[45%] h-[150px] top-4 left-[8%] rotate-[-4deg] rounded-md overflow-hidden shadow-lg z-5"
                                    style={{
                                        filter: hoveredGameId && hoveredGameId !== displayGames[0].id ? 'blur(1px)' : 'none',
                                        transition: 'filter 0.2s ease-in-out'
                                    }}
                                    whileHover={{ y: -5, rotate: 0, transition: { duration: 0.2 } }}
                                    onClick={(e) => handleGameClick(e, displayGames[0].igdb_id || displayGames[0].id)}
                                    onMouseEnter={() => setHoveredGameId(displayGames[0].id)}
                                >
                                    <img
                                        src={displayGames[0].coverImage || "/images/placeholder-cover.jpg"}
                                        alt={displayGames[0].name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                </motion.div>
                                <motion.div
                                    className="absolute w-[45%] h-[150px] top-4 left-[47%] rotate-[4deg] z-10 rounded-md overflow-hidden shadow-lg"
                                    style={{
                                        filter: hoveredGameId && hoveredGameId !== displayGames[1].id ? 'blur(1px)' : 'none',
                                        transition: 'filter 0.2s ease-in-out'
                                    }}
                                    whileHover={{ y: -5, rotate: 0, transition: { duration: 0.2 } }}
                                    onClick={(e) => handleGameClick(e, displayGames[1].igdb_id || displayGames[1].id)}
                                    onMouseEnter={() => setHoveredGameId(displayGames[1].id)}
                                >
                                    <img
                                        src={displayGames[1].coverImage || "/images/placeholder-cover.jpg"}
                                        alt={displayGames[1].name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                </motion.div>
                            </>
                        ) : (
                            displayGames.map((game, index) => (
                                <motion.div
                                    key={game.id}
                                    className={`absolute rounded-md overflow-hidden shadow-lg ${index === 0 ? "w-[45%] h-[150px] top-4 left-4 rotate-[-5deg] z-5" :
                                        index === 1 ? "w-[45%] h-[150px] top-4 left-[25%] rotate-[3deg] z-10" :
                                            "w-[45%] h-[150px] top-6 left-[45%] rotate-[8deg] z-20"
                                        }`}
                                    style={{
                                        filter: hoveredGameId && hoveredGameId !== game.id ? 'blur(1px)' : 'none',
                                        transition: 'filter 0.2s ease-in-out'
                                    }}
                                    whileHover={{ y: -5, rotate: 0, transition: { duration: 0.2 } }}
                                    onClick={(e) => handleGameClick(e, game.igdb_id || game.id)}
                                    onMouseEnter={() => setHoveredGameId(game.id)}
                                >
                                    <img
                                        src={game.coverImage || "/images/placeholder-cover.jpg"}
                                        alt={game.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                </motion.div>
                            ))
                        )}
                    </>
                ) : (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className={`absolute rounded-md overflow-hidden shadow-lg bg-gray-800/50 flex items-center justify-center ${i === 0 ? "w-[45%] h-[150px] top-4 left-4 rotate-[-5deg]" :
                                    i === 1 ? "w-[45%] h-[150px] top-4 left-[25%] rotate-[3deg] z-10" :
                                        "w-[45%] h-[150px] top-6 left-[45%] rotate-[8deg] z-20"
                                    }`}
                            >
                                {i === 1 && (
                                    <span className="text-gray-500 text-xs text-center px-2">No games added</span>
                                )}
                            </div>
                        ))}
                    </>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-900/10"></div>
            </div>

            {/* List Info Section */}
            <div className="relative p-4 bg-surface-dark/90">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 max-w-[70%]">
                        <h4 className="font-bold text-light text-lg group-hover:text-primary transition-colors truncate" title={list.name}>
                            {list.name}
                        </h4>
                        <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </div>

                    {/* Like Count Badge */}
                    <div className="flex items-center gap-1.5">
                        <Heart
                            size={14}
                            className={`transition-colors ${list.user_liked ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                        />
                        <span className="text-sm text-gray-400 font-medium">{list.likes_count}</span>
                    </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>by</span>
                        <span className="text-gray-400 font-medium">{list.creator?.username || "Unknown"}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                        {list.game_count || list.games?.length || 0} games
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

// Loading skeleton - matches ListCard skeleton
const ListCardSkeleton = () => (
    <div className="relative w-full rounded-xl overflow-hidden bg-dark animate-pulse">
        <div className="relative h-[180px] p-3 overflow-hidden">
            {[...Array(3)].map((_, i) => (
                <div
                    key={i}
                    className={`absolute w-[45%] h-[150px] rounded-md bg-gray-800 shadow-lg ${i === 0 ? "top-4 left-4 rotate-[-5deg]" :
                        i === 1 ? "top-4 left-[25%] rotate-[3deg] z-10" :
                            "top-6 left-[45%] rotate-[8deg] z-20"
                        }`}
                />
            ))}
        </div>
        <div className="relative p-4 bg-surface-dark/90">
            <div className="h-5 bg-gray-800 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-800 rounded w-1/3"></div>
        </div>
    </div>
);

// Custom Sort Dropdown for Lists
const ListSortDropdown = ({ sortOption, onSortChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer ${isOpen
                    ? "bg-surface/80 text-white"
                    : "bg-surface/30 text-gray-400 hover:text-white hover:bg-surface/50"
                    } transition-all`}
            >
                <span>Sort: {LIST_SORT_OPTIONS.find(o => o.value === sortOption)?.label}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-surface-dark rounded-lg shadow-lg z-50 border border-gray-800/50 overflow-hidden">
                    <div className="p-2">
                        {LIST_SORT_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onSortChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded text-[13px] flex items-center cursor-pointer ${sortOption === option.value
                                    ? "bg-surface/80 text-white font-semibold"
                                    : "text-gray-400 hover:bg-surface hover:text-white"
                                    } transition-colors`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const CommunityListsPage = () => {
    const [featuredLists, setFeaturedLists] = useState([]);
    const [publicLists, setPublicLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState(() => localStorage.getItem("communityListsSort") || "popular");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Persist sort preference
    useEffect(() => {
        localStorage.setItem("communityListsSort", sort);
    }, [sort]);

    useEffect(() => {
        const fetchLists = async () => {
            setLoading(true);
            try {
                const [featured, allLists] = await Promise.all([
                    getFeaturedLists(8),
                    getPublicLists(1, 20, sort)
                ]);
                setFeaturedLists(featured);
                setPublicLists(allLists.lists);
                setHasMore(allLists.has_more);
                setPage(1);
            } catch (error) {
                console.error("Error fetching lists:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLists();
    }, [sort]);

    const loadMore = async () => {
        try {
            const nextPage = page + 1;
            const moreData = await getPublicLists(nextPage, 20, sort);
            setPublicLists(prev => [...prev, ...moreData.lists]);
            setHasMore(moreData.has_more);
            setPage(nextPage);
        } catch (error) {
            console.error("Error loading more:", error);
        }
    };

    // Filter lists by search query
    const filteredLists = publicLists.filter(list =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <div className="min-h-screen bg-dark pt-20 pb-16">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold text-white">Community Lists</h1>
                    </div>
                    <p className="text-gray-400">
                        Discover curated game collections from the community
                    </p>
                </motion.div>

                {/* Featured Lists Section */}
                {!loading && featuredLists.length > 0 && (
                    <section className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="text-primary" size={20} />
                            <h2 className="text-xl font-bold text-white">Featured Lists</h2>
                        </div>
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {featuredLists.slice(0, 4).map(list => (
                                <motion.div key={list.id} variants={itemVariants}>
                                    <PublicListCard list={list} />
                                </motion.div>
                            ))}
                        </motion.div>
                    </section>
                )}

                {/* All Lists Section */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl font-bold text-white">Browse Lists</h2>

                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search lists..."
                                    className="w-48 px-3 py-1.5 bg-surface/30 border border-gray-800/30 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>

                            {/* Sort */}
                            <ListSortDropdown sortOption={sort} onSortChange={setSort} />
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <ListCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : filteredLists.length === 0 ? (
                        <motion.div
                            className="text-center py-16 px-6 text-gray-400 bg-surface-dark/30 rounded-xl border border-gray-800/20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <h4 className="mb-2 font-bold text-lg text-gray-300">
                                {searchQuery ? "No lists found" : "No public lists yet"}
                            </h4>
                            <p className="text-sm max-w-md mx-auto">
                                {searchQuery
                                    ? "Try a different search term"
                                    : "Be the first to create a public list and share your favorite games with the community!"}
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {filteredLists.map(list => (
                                    <motion.div key={list.id} variants={itemVariants}>
                                        <PublicListCard list={list} />
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Load More */}
                            {hasMore && !searchQuery && (
                                <div className="flex justify-center mt-8">
                                    <motion.button
                                        onClick={loadMore}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-surface/30 text-gray-300 rounded-lg hover:bg-surface/50 hover:text-white transition-colors font-medium"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Load More Lists
                                    </motion.button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};

export default CommunityListsPage;
