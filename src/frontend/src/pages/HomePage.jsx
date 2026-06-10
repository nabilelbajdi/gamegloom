// src/pages/HomePage.jsx
import React from "react";
import PageMeta from "../components/common/PageMeta";
import Hero from "../components/home/HeroSection";
import AnticipatedGames from "../components/home/AnticipatedGames";
import ReviewedGames from "../components/home/ReviewedGames";
import FeaturedAnticipatedGames from "../components/home/FeaturedAnticipatedGames";
import TrendingGames from "../components/home/TrendingGames";
import HighlyRatedGames from "../components/home/HighlyRatedGames";
import LatestGames from "../components/home/LatestGames";
import useIsMobile from "../hooks/useIsMobile";
import HomeMobile from "./mobile/HomeMobile";

const HomePage = () => {
    const isMobile = useIsMobile();
    if (isMobile) return <HomeMobile />;

    return (
        <>
            <PageMeta />
            <Hero />
            <div className="bg-[var(--bg-base)]">
                <FeaturedAnticipatedGames />
                <div className="container mx-auto px-4 py-6">
                    <TrendingGames />
                </div>
                <ReviewedGames />
                <div className="container mx-auto px-4 py-6">
                    <AnticipatedGames />
                    <HighlyRatedGames />
                    <LatestGames />
                </div>
            </div>
        </>
    );
};

export default HomePage;