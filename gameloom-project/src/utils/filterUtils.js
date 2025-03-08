// Utility functions for filtering games and normalizing data

// Compares platform names to the normalized platform names
export const normalizePlatformName = (platform) => {
  const platformMappings = {
    "PS5": "PlayStation 5",
    "PS4": "PlayStation 4",
    "PS3": "PlayStation 3",
    "PS2": "PlayStation 2",
    "Switch": "Nintendo Switch",
    "PC": "PC (Microsoft Windows)"
  };

  // If the platform is a shortened version, return the full version
  if (platformMappings[platform]) {
    return platformMappings[platform];
  }
  
  // Otherwise, return the platform name as is
  return platform;
};

export const normalizeGenreName = (genre) => {
  const genreMappings = {
    "RPG": "Role-playing (RPG)"
  };

  if (genreMappings[genre]) {
    return genreMappings[genre];
  }
  
  return genre;
};

export const stringContainsFilter = (value, filter) => {
  if (!value || !filter) return false;
  return value.toLowerCase().includes(filter.toLowerCase());
};

export const gameMatchesPlatform = (game, platform) => {
  if (!game.platforms) return false;
  
  const normalizedPlatform = normalizePlatformName(platform);
  
  if (typeof game.platforms === 'string') {
    return stringContainsFilter(game.platforms, normalizedPlatform) || 
           stringContainsFilter(game.platforms, platform);
  } else if (Array.isArray(game.platforms)) {
    return game.platforms.some(p => 
      stringContainsFilter(p, normalizedPlatform) ||
      stringContainsFilter(p, platform)
    );
  }
  
  return false;
};

export const gameMatchesGenre = (game, genre) => {
  if (!game.genres) return false;
  
  const normalizedGenre = normalizeGenreName(genre);
  
  if (typeof game.genres === 'string') {
    return stringContainsFilter(game.genres, normalizedGenre) || 
           stringContainsFilter(game.genres, genre);
  } else if (Array.isArray(game.genres)) {
    return game.genres.some(g => 
      stringContainsFilter(g, normalizedGenre) ||
      stringContainsFilter(g, genre)
    );
  }
  
  return false;
};

export const gameMatchesTheme = (game, theme) => {
  if (!game.themes) return false;
  
  if (typeof game.themes === 'string') {
    return stringContainsFilter(game.themes, theme);
  } else if (Array.isArray(game.themes)) {
    return game.themes.some(t => stringContainsFilter(t, theme));
  }
  
  return false;
};

export const gameMatchesGameMode = (game, mode) => {
  const modes = game.gameModes || game.game_modes;
  if (!modes) return false;
  
  if (typeof modes === 'string') {
    return stringContainsFilter(modes, mode);
  } else if (Array.isArray(modes)) {
    return modes.some(m => stringContainsFilter(m, mode));
  }
  
  return false;
};

export const gameMatchesPerspective = (game, perspective) => {
  const perspectives = game.playerPerspectives || game.player_perspectives;
  if (!perspectives) return false;
  
  if (typeof perspectives === 'string') {
    return stringContainsFilter(perspectives, perspective);
  } else if (Array.isArray(perspectives)) {
    return perspectives.some(p => stringContainsFilter(p, perspective));
  }
  
  return false;
};

export const gameMatchesRating = (game, minRating) => {
  if (minRating === 0) return true;
  
  const gameRating = typeof game.rating === 'string' ? parseFloat(game.rating) : game.rating;
  return gameRating !== undefined && gameRating !== null && 
         gameRating !== "N/A" && gameRating >= minRating;
};

export const gamePassesAllFilters = (game, filters) => {
  const { 
    genres = [], 
    themes = [], 
    platforms = [], 
    gameModes = [], 
    playerPerspectives = [], 
    minRating = 0 
  } = filters;
  
  if (genres.length === 0 && themes.length === 0 && 
      platforms.length === 0 && gameModes.length === 0 && 
      playerPerspectives.length === 0 && minRating === 0) {
    return true;
  }
  
  const matchesGenre = genres.length === 0 || 
    genres.some(genre => gameMatchesGenre(game, genre));
  
  const matchesTheme = themes.length === 0 || 
    themes.some(theme => gameMatchesTheme(game, theme));
  
  const matchesPlatform = platforms.length === 0 || 
    platforms.some(platform => gameMatchesPlatform(game, platform));
  
  const matchesGameMode = gameModes.length === 0 || !gameModes || 
    gameModes.some(mode => gameMatchesGameMode(game, mode));
  
  const matchesPerspective = playerPerspectives.length === 0 || !playerPerspectives || 
    playerPerspectives.some(perspective => gameMatchesPerspective(game, perspective));
  
  const matchesRating = gameMatchesRating(game, minRating);
  
  return matchesGenre && matchesTheme && matchesPlatform && 
         matchesGameMode && matchesPerspective && matchesRating;
}; 