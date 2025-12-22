export const getUpcomingFeaturedGames = (games, count = 4) => {
  if (!games || games.length === 0) return [];

  const now = new Date();

  // Minimum hype score required for a game to be considered "anticipated"
  const MIN_HYPE_THRESHOLD = 50;

  // Detects placeholder release dates (usually December 31st)
  const isPlaceholderDate = (dateString) => {
    const date = new Date(dateString);
    return date.getMonth() === 11 && date.getDate() === 31; // December 31st
  };

  // Filter by upcoming games with release dates and sort by nearest release date
  const upcomingGames = games
    .filter(game => {
      if (!game.firstReleaseDate) return false;
      const releaseDate = new Date(game.firstReleaseDate);
      return releaseDate > now && (game.hypes || 0) >= MIN_HYPE_THRESHOLD;
    })
    .sort((a, b) => {
      return new Date(a.firstReleaseDate) - new Date(b.firstReleaseDate);
    });

  // If we have fewer games than requested, return all of them
  if (upcomingGames.length <= count) {
    return upcomingGames;
  }

  const result = [];

  // Separate games with real dates from those with placeholder dates
  const gamesWithPreciseDates = upcomingGames.filter(game => !isPlaceholderDate(game.firstReleaseDate));
  const gamesWithPlaceholderDates = upcomingGames.filter(game => isPlaceholderDate(game.firstReleaseDate));

  // Selection strategy for featured games

  // 1. Include the next upcoming game with a precise release date
  if (gamesWithPreciseDates.length > 0) {
    result.push(gamesWithPreciseDates[0]);
  } else if (upcomingGames.length > 0) {
    result.push(upcomingGames[0]);
  }

  // 2. Include a game releasing in 1-3 months with high hype score
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(now.getMonth() + 1);
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(now.getMonth() + 3);

  const mediumTermGames = gamesWithPreciseDates.filter(game => {
    const releaseDate = new Date(game.firstReleaseDate);
    return releaseDate >= oneMonthFromNow && releaseDate <= threeMonthsFromNow;
  });

  if (mediumTermGames.length > 0) {
    const highestHypeMediumTerm = [...mediumTermGames].sort((a, b) =>
      (b.hypes || 0) - (a.hypes || 0)
    )[0];

    if (highestHypeMediumTerm && !result.find(g => g.id === highestHypeMediumTerm.id)) {
      result.push(highestHypeMediumTerm);
    }
  }

  // 3. Include a game releasing in 3-6 months with high hype score
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(now.getMonth() + 6);

  const longerTermGames = gamesWithPreciseDates.filter(game => {
    const releaseDate = new Date(game.firstReleaseDate);
    return releaseDate > threeMonthsFromNow && releaseDate <= sixMonthsFromNow;
  });

  if (longerTermGames.length > 0) {
    const highestHypeLongerTerm = [...longerTermGames].sort((a, b) =>
      (b.hypes || 0) - (a.hypes || 0)
    )[0];

    if (highestHypeLongerTerm && !result.find(g => g.id === highestHypeLongerTerm.id)) {
      result.push(highestHypeLongerTerm);
    }
  }

  // 4. Fill remaining slots with highest hyped games
  if (result.length < count) {
    // Prioritize games with precise release dates
    const remainingPreciseDateGames = gamesWithPreciseDates
      .filter(game => !result.find(g => g.id === game.id))
      .sort((a, b) => (b.hypes || 0) - (a.hypes || 0))
      .slice(0, count - result.length);

    result.push(...remainingPreciseDateGames);

    // Use placeholder date games if needed to reach requested count
    if (result.length < count) {
      const remainingPlaceholderGames = gamesWithPlaceholderDates
        .filter(game => !result.find(g => g.id === game.id))
        .sort((a, b) => (b.hypes || 0) - (a.hypes || 0))
        .slice(0, count - result.length);

      result.push(...remainingPlaceholderGames);
    }
  }

  return result;
};

/**
 * Normalizes game data to ensure consistent structure across the application
 * Especially useful for search results and API responses with inconsistent field names
 * 
 * @param {Object} game - The game object to normalize
 * @returns {Object} - A normalized game object with consistent field names
 */
export const normalizeGameData = (game) => {
  if (!game) return null;

  return {
    ...game,
    id: game.igdb_id || game.id,
    igdb_id: game.igdb_id || game.id,
    coverImage: game.coverImage || game.cover_image || game.cover,
    rating: formatRating(game.rating || game.total_rating || "N/A"),
    releaseDate: game.releaseDate || game.first_release_date || game.release_date,
    genres: game.genres || "Unknown Genre",
    platforms: game.platforms || "",
    themes: game.themes || "",
    developers: game.developers || "",
    publisher: game.publisher || game.publishers || "",
    gameModes: game.gameModes || game.game_modes || "",
    playerPerspectives: game.playerPerspectives || game.player_perspectives || ""
  };
};

/**
 * Formats a rating value to display in a consistent format across the application
 * 
 * @param {number|string|null|undefined} rating - The raw rating value
 * @returns {string} - Formatted rating value on a 5-point scale or "N/A"
 */
export const formatRating = (rating) => {
  if (rating === null || rating === undefined || rating === 0 || rating === "" || rating === "N/A") {
    return "N/A";
  }

  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;

  if (isNaN(numRating) || numRating <= 0) {
    return "N/A";
  }

  // Determine the scale and convert to a 5-point scale
  try {
    if (numRating > 10) {
      return (numRating / 20).toFixed(1);
    } else if (numRating > 5) {
      return (numRating / 2).toFixed(1);
    } else {
      return numRating.toFixed(1);
    }
  } catch (e) {
    console.error("Error formatting rating:", e, "Rating value:", rating);
    return "N/A";
  }
};

/**
 * Normalizes an array of game data
 * 
 * @param {Array} games - Array of game objects to normalize
 * @returns {Array} - Array of normalized game objects
 */
export const normalizeGamesData = (games) => {
  if (!games || !Array.isArray(games)) return [];
  return games.map(normalizeGameData);
};

/**
 * Normalizes platform names to short, UI-friendly tags.
 * @param {string} platformName - The raw platform name from IGDB or other sources
 * @returns {string} - The normalized short name (e.g., "PS5", "PC")
 */
export const normalizePlatformName = (platformName) => {
  if (!platformName) return "";
  const p = platformName.trim();

  // PlayStation
  if (/playstation 5/i.test(p)) return "PS5";
  if (/playstation 4/i.test(p)) return "PS4";
  if (/playstation/i.test(p)) return "PS";

  // Xbox
  if (/xbox series x\|s/i.test(p) || /xbox series/i.test(p)) return "Xbox XS";
  if (/xbox one/i.test(p)) return "Xbox One";
  if (/xbox/i.test(p)) return "Xbox";

  // Nintendo
  if (/nintendo switch 2/i.test(p)) return "Switch 2";
  if (/nintendo switch/i.test(p)) return "Switch";

  // PC
  if (/pc \(microsoft windows\)/i.test(p) || /microsoft windows/i.test(p)) return "PC";

  // Mobile/Other
  if (/ios/i.test(p) || /android/i.test(p)) return "Mobile";
  if (/mac/i.test(p) || /macos/i.test(p)) return "Mac";
  if (/linux/i.test(p)) return "Linux";

  return p;
};

/**
 * Transforms an IGDB image URL to a high-resolution version (1080p).
 * Replaces size tokens like 't_thumb', 't_cover_big', etc. with 't_1080p'.
 * 
 * @param {string} url - The original image URL
 * @returns {string} - The high-resolution image URL
 */
export const getHighResImageUrl = (url) => {
  if (!url) return "";
  // IGDB uses patterns like /t_thumb/, /t_cover_big/, /t_cover_small/
  // We want to replace any t_xxxx with t_1080p for max quality
  return url.replace(/\/t_[a-zA-Z0-9_]+\//, '/t_1080p/');
}; 