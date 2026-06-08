import { Gamepad, Building, Calendar, Clock } from "lucide-react";
import StarRating from "../UI/StarRating";

// Title + quick-info meta + rating, extracted from GameDetails so the desktop
// details block and the mobile poster-left header share one source.
// compact=false reproduces the original desktop header exactly; compact=true is the
// mobile variant (smaller title, wrapping meta, rating below).
const GameHeader = ({ game, compact = false }) => {
  const meta = (
    <>
      {game.game_type_name && (
        <span className="inline-flex items-center gap-1">
          <Gamepad className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>{game.game_type_name}</span>
        </span>
      )}

      {game.game_type_name && (game.developers || game.firstReleaseDate || game.time_to_beat?.normally) && (
        <div className="h-3 w-px bg-gray-700"></div>
      )}

      {game.developers && (
        <span className="inline-flex items-center gap-1">
          <Building className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>{game.developers.split(", ")[0]}</span>
        </span>
      )}

      {game.developers && (game.firstReleaseDate || game.time_to_beat?.normally) && (
        <div className="h-3 w-px bg-gray-700"></div>
      )}

      {game.firstReleaseDate && (
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>{new Date(game.firstReleaseDate).getFullYear()}</span>
        </span>
      )}

      {game.firstReleaseDate && game.time_to_beat?.normally && (
        <div className="h-3 w-px bg-gray-700"></div>
      )}

      {game.time_to_beat?.normally && (
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>{game.time_to_beat.normally.formatted} to beat</span>
        </span>
      )}
    </>
  );

  const rating = (
    <StarRating
      rating={game.rating}
      totalRatingCount={game.overallRatingCount || game.totalRatingCount}
      aggregatedRatingCount={game.aggregatedRatingCount}
      firstReleaseDate={game.firstReleaseDate}
    />
  );

  if (compact) {
    return (
      <div>
        <h1 className="text-xl font-bold leading-tight text-white">{game.name}</h1>
        <div className="flex flex-wrap items-center text-gray-400 text-xs font-semibold mt-1.5 gap-x-2.5 gap-y-1">
          {meta}
        </div>
        <div className="mt-2.5">{rating}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 mb-3">
      <div className="flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white">{game.name}</h1>
        <div className="flex items-center text-gray-400 text-sm font-semibold mt-1 gap-3">
          {meta}
        </div>
      </div>
      <div className="flex-shrink-0">{rating}</div>
    </div>
  );
};

export default GameHeader;
