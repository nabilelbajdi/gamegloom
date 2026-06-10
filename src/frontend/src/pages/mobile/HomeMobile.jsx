import PageMeta from "../../components/common/PageMeta";
import Hero from "../../components/home/HeroSection";
import TrendingGames from "../../components/home/TrendingGames";
import AnticipatedGames from "../../components/home/AnticipatedGames";
import HighlyRatedGames from "../../components/home/HighlyRatedGames";
import LatestGames from "../../components/home/LatestGames";
import ReviewedGames from "../../components/home/ReviewedGames";

// Mobile Home: full-bleed hero, then stacked edge-to-edge shelves.
// Reuses the same self-contained section components as the desktop HomePage.
export default function HomeMobile() {
  return (
    <div className="bg-[var(--bg-base)]">
      <PageMeta />
      <Hero />
      <div className="flex flex-col gap-8 px-4 py-5">
        <TrendingGames />
        <AnticipatedGames />
        <HighlyRatedGames />
        <LatestGames />
        <ReviewedGames />
      </div>
    </div>
  );
}
