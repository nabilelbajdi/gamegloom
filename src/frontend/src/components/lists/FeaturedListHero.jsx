// src/components/lists/FeaturedListHero.jsx
import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, ArrowRight, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getHighResImage, pickHeroArt } from "../../utils/gameDisplay";

// Covers are portrait (roughly 3:4). Stretching one across a wide banner crops it
// to an unrecognisable sliver, so they are laid out at their real aspect ratio in a
// fan instead, over a blurred landscape backdrop that is shaped for a wide box.
const MAX_COVERS = 5;

// Fanned outward from the centre. Kept static so the layout is stable per list.
const ROTATIONS = [-10, -5, 0, 5, 10];

const FeaturedListHero = ({ list }) => {
    const navigate = useNavigate();

    if (!list) return null;

    const games = list.games || [];

    const covers = games
        .map((game) => game.coverImage)
        .filter(Boolean)
        .slice(0, MAX_COVERS);

    // Landscape artwork from the first of the shown games that has any, the same
    // source the game page uses for its backdrop. Falling back to a cover is a last
    // resort: it's portrait, so only the heavy blur makes the crop acceptable.
    const backdrop =
        games.slice(0, MAX_COVERS).map(pickHeroArt).find(Boolean) ||
        (covers[0] ? getHighResImage(covers[0]) : null);
    const gameCount = list.game_count ?? list.games?.length ?? 0;
    const open = () => navigate(`/lists/${list.id}`);

    return (
        <motion.section
            className="relative overflow-hidden rounded-2xl border border-white/5 cursor-pointer"
            initial="rest"
            animate="rest"
            whileHover="hover"
            onClick={open}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open();
                }
            }}
            aria-label={`Featured list: ${list.name}`}
        >
            {/* Softened, not obliterated: enough blur to sit behind text without
                fighting it, but the artwork should still read as a picture. Scaled up
                so the blur has no visible edges. */}
            {backdrop ? (
                <div
                    className="absolute inset-0 scale-105 bg-cover bg-center"
                    style={{ backgroundImage: `url(${backdrop})`, filter: "blur(8px)" }}
                    aria-hidden="true"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" aria-hidden="true" />
            )}

            {/* Nearly opaque on the left so the copy stays readable, clearing quickly
                to the right so the artwork behind the covers is actually visible. */}
            <div className="absolute inset-0 bg-dark/35" aria-hidden="true" />
            <div
                className="absolute inset-0 bg-gradient-to-r from-dark via-dark/70 to-transparent"
                aria-hidden="true"
            />

            <div className="relative grid items-center gap-8 p-6 md:p-10 lg:grid-cols-[minmax(0,1fr)_auto]">
                {/* Copy */}
                <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                            Featured list
                        </span>
                    </div>

                    <h2 className="mb-3 text-2xl font-bold text-white md:text-4xl">
                        {list.name}
                    </h2>

                    {list.description && (
                        <p className="mb-5 max-w-xl text-sm leading-relaxed text-gray-300 line-clamp-2 md:text-base">
                            {list.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-400">
                        <span className="flex items-center gap-2">
                            {list.creator?.avatar ? (
                                <img
                                    src={list.creator.avatar}
                                    alt=""
                                    className="h-6 w-6 rounded-full object-cover ring-1 ring-white/10"
                                    loading="lazy"
                                />
                            ) : null}
                            <span>
                                by <span className="font-medium text-gray-200">{list.creator?.username || "Unknown"}</span>
                            </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Layers size={14} />
                            {gameCount} games
                        </span>
                        {list.likes_count > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Heart
                                    size={14}
                                    className={list.user_liked ? "fill-red-500 text-red-500" : ""}
                                />
                                {list.likes_count}
                            </span>
                        )}
                    </div>

                    <motion.span
                        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                        variants={{ rest: { gap: "0.5rem" }, hover: { gap: "0.75rem" } }}
                    >
                        View list
                        <ArrowRight size={16} />
                    </motion.span>
                </div>

                {/* Cover fan. Each cover keeps its native 3:4 ratio, so nothing is cropped. */}
                {covers.length > 0 && (
                    <div className="flex justify-start lg:justify-end" aria-hidden="true">
                        {covers.map((cover, index) => (
                            <motion.div
                                key={index}
                                className={`w-20 shrink-0 overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10 sm:w-24 lg:w-32 xl:w-36 ${
                                    // Overlap scales with the cover so the fan keeps
                                    // its proportions across breakpoints.
                                    index === 0 ? "" : "-ml-6 sm:-ml-7 lg:-ml-9 xl:-ml-10"
                                }`}
                                style={{
                                    aspectRatio: "3 / 4",
                                    zIndex: index,
                                }}
                                variants={{
                                    rest: { rotate: ROTATIONS[index], y: 0 },
                                    // Straighten and lift slightly on hover so the
                                    // stack reads as one object rather than clutter.
                                    hover: { rotate: ROTATIONS[index] * 0.35, y: -10 },
                                }}
                                transition={{ type: "spring", stiffness: 250, damping: 22 }}
                            >
                                <img
                                    src={cover}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.section>
    );
};

export const FeaturedListHeroSkeleton = () => (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-surface/20 p-6 md:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0 animate-pulse">
                <div className="mb-4 h-3 w-28 rounded bg-gray-800" />
                <div className="mb-3 h-8 w-2/3 rounded bg-gray-800" />
                <div className="mb-2 h-3 w-full max-w-xl rounded bg-gray-800" />
                <div className="mb-6 h-3 w-1/2 rounded bg-gray-800" />
                <div className="h-3 w-40 rounded bg-gray-800" />
            </div>
            <div className="flex justify-start lg:justify-end">
                {[...Array(MAX_COVERS)].map((_, index) => (
                    <div
                        key={index}
                        className={`w-20 shrink-0 animate-pulse rounded-lg bg-gray-800 ring-1 ring-white/10 sm:w-24 lg:w-32 xl:w-36 ${
                            index === 0 ? "" : "-ml-6 sm:-ml-7 lg:-ml-9 xl:-ml-10"
                        }`}
                        style={{
                            aspectRatio: "3 / 4",
                            transform: `rotate(${ROTATIONS[index]}deg)`,
                            zIndex: index,
                        }}
                    />
                ))}
            </div>
        </div>
    </div>
);

export default FeaturedListHero;
