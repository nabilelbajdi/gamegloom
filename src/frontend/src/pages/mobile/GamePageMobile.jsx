import GameCover from "../../components/game/GameCover";
import GameHeader from "../../components/GamePage/GameHeader";
import GameSticky from "../../components/GamePage/GameSticky";
import GameDetails from "../../components/GamePage/GameDetails";
import ReviewList from "../../components/reviews/ReviewList";
import SimilarGames from "../../components/GamePage/SimilarGames";
import RelatedContent from "../../components/GamePage/RelatedContent";
import GameMedia from "../../components/GamePage/GameMedia";

// Mobile game page: poster-left header (cover + compact title/meta), reused
// rating/list actions, then the detail sections stacked. Shares all data with
// the desktop GamePage; only the arrangement differs.
const GamePageMobile = ({ game }) => {
  return (
    <div className="relative max-w-2xl mx-auto px-4 pt-4 pb-10">
      {/* Poster-left header */}
      <div className="flex gap-4">
        <div className="w-28 shrink-0">
          <GameCover game={game} />
        </div>
        <div className="flex-1 min-w-0">
          <GameHeader game={game} compact />
        </div>
      </div>

      {/* Reused rating + list actions (cover hidden; shown in the header above) */}
      <div className="mt-5">
        <GameSticky game={game} showCover={false} />
      </div>

      {/* Detail sections (header suppressed — shown in the poster header above) */}
      <GameDetails game={game} trailer={game.videos?.[0]} showHeader={false} />
      <ReviewList gameId={game.igdb_id} releaseDate={game.firstReleaseDate} game={game} />
      <SimilarGames games={game.similarGames} />
      <RelatedContent
        dlcs={game.dlcs}
        expansions={game.expansions}
        remakes={game.remakes}
        remasters={game.remasters}
        bundles={game.bundles}
        ports={game.ports}
        standalone_expansions={game.standalone_expansions}
        seasons={game.seasons}
        packs={game.packs}
        editions={game.editions}
      />
      <GameMedia screenshots={game.screenshots} videos={game.videos} artworks={game.artworks} />
    </div>
  );
};

export default GamePageMobile;
