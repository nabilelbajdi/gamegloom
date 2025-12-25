// src/api.js
import { normalizeGameData, normalizeGamesData } from './utils/gameUtils';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Centralized Fetch Games
async function fetchGames(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    const data = await response.json();
    // Normalize the game data before returning it
    return Array.isArray(data) ? normalizeGamesData(data) : normalizeGameData(data);
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

// Fetch Games by Category
export const fetchAnticipatedGames = () => fetchGames("anticipated-games");
export const fetchHighlyRatedGames = () => fetchGames("highly-rated-games");
export const fetchLatestGames = () => fetchGames("latest-games");
export const fetchTrendingGames = () => fetchGames("trending-games");

// Fetch Games by Genre or Theme (with pagination)
export const fetchGamesByGenre = (genreSlug, limit = 50, offset = 0) =>
  fetchGames(`games?genre=${genreSlug}&limit=${limit}&offset=${offset}`);
export const fetchGamesByTheme = (themeSlug, limit = 50, offset = 0) =>
  fetchGames(`games?theme=${themeSlug}&limit=${limit}&offset=${offset}`);

// Fetch total game count for genre/theme
export const fetchGameCount = async (categoryType, filter) => {
  try {
    const param = categoryType === "genre" ? "genre" : "theme";
    const response = await fetch(`${BASE_URL}/games/count?${param}=${filter}`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.total || 0;
  } catch (error) {
    console.error("Error fetching game count:", error);
    return 0;
  }
};

// Fetch Multiple Game Details
export const fetchMultipleGameDetails = async (gameIds) => {
  if (!gameIds || gameIds.length === 0) return [];
  return await fetchGames(`games?ids=${gameIds.join(",")}`);
};

// Fetch Single Game Details
export const fetchGameDetails = (identifier) => fetchGames(`games/${identifier}`);

// User Game Collection API Functions
export const fetchUserCollection = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/user-games/collection`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch collection");
  }

  return await response.json();
};

export const addGameToCollection = async (gameId, status) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/user-games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      game_id: gameId,
      status: status
    })
  });

  if (!response.ok) {
    throw new Error("Failed to add game to collection");
  }

  return await response.json();
};

export const updateGameStatus = async (gameId, newStatus) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/user-games/${gameId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      status: newStatus
    })
  });

  if (!response.ok) {
    throw new Error("Failed to update game status");
  }

  return await response.json();
};

export const removeGameFromCollection = async (gameId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/user-games/${gameId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to remove game from collection");
  }

  return await response.json();
};

// Review API Functions
export const createReview = async (gameId, rating, content, advancedFields = {}) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      game_id: gameId,
      rating,
      content,
      // Advanced review fields
      platform: advancedFields.platform || null,
      playtime_hours: advancedFields.playtime_hours || null,
      completion_status: advancedFields.completion_status || null,
      story_rating: advancedFields.story_rating || null,
      gameplay_rating: advancedFields.gameplay_rating || null,
      visuals_rating: advancedFields.visuals_rating || null,
      audio_rating: advancedFields.audio_rating || null,
      performance_rating: advancedFields.performance_rating || null,
      recommended: advancedFields.recommended
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to create review");
  }

  return data;
};

export const updateReview = async (reviewId, rating, content, advancedFields = {}) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      rating,
      content,
      platform: advancedFields.platform || null,
      playtime_hours: advancedFields.playtime_hours || null,
      completion_status: advancedFields.completion_status || null,
      story_rating: advancedFields.story_rating || null,
      gameplay_rating: advancedFields.gameplay_rating || null,
      visuals_rating: advancedFields.visuals_rating || null,
      audio_rating: advancedFields.audio_rating || null,
      performance_rating: advancedFields.performance_rating || null,
      recommended: advancedFields.recommended
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to update review");
  }

  return data;
};

export const deleteReview = async (reviewId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to delete review");
  }
};

export const getGameReviews = async (gameId) => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const response = await fetch(`${BASE_URL}/reviews/game/${gameId}`, {
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch reviews");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};

export const getUserReviewForGame = async (gameId) => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const response = await fetch(`${BASE_URL}/reviews/user/game/${gameId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch user review");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user review:", error);
    return null;
  }
};

export const toggleReviewLike = async (reviewId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/reviews/${reviewId}/like`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to toggle review like");
  }

  return await response.json();
};

export const addReviewComment = async (reviewId, content) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/reviews/${reviewId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    throw new Error("Failed to add comment");
  }

  return await response.json();
};

export const updateComment = async (reviewId, commentId, content) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/reviews/${reviewId}/comments/${commentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to update comment");
  }

  return await response.json();
};

export const deleteComment = async (reviewId, commentId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/reviews/${reviewId}/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Failed to delete comment");
  }
};

export const getReviewComments = async (reviewId) => {
  const response = await fetch(`${BASE_URL}/reviews/${reviewId}/comments`);
  if (!response.ok) {
    throw new Error("Failed to fetch comments");
  }
  return await response.json();
};

export const getRecentReviews = async () => {
  try {
    const response = await fetch(`${BASE_URL}/reviews/recent`);
    if (!response.ok) {
      throw new Error("Failed to fetch recent reviews");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching recent reviews:", error);
    return [];
  }
};

export const getReview = async (reviewId) => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
    headers
  });

  if (!response.ok) {
    throw new Error("Failed to fetch review");
  }

  return await response.json();
};

export const getGame = async (gameId) => {
  return fetchGames(`games/${gameId}`);
};

// Fetch Recommendations
export const fetchRecommendations = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/recommendations/games`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch recommendations");
  }

  return await response.json();
};

// User Profile Functions
export const updateUserProfile = async (userData) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/me/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }

  return await response.json();
};

export const uploadAvatar = async (formData) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/me/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error("Failed to upload avatar");
  }

  return await response.json();
};

export const fetchUserStats = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(`${BASE_URL}/users/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user stats");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      total_games: 0,
      want_to_play_count: 0,
      playing_count: 0,
      played_count: 0,
      reviews_count: 0,
      average_rating: null,
      lists_count: 0
    };
  }
};

export const fetchUserActivities = async (limit = 10) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  try {
    const response = await fetch(`${BASE_URL}/users/activities?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user activities");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return { activities: [] };
  }
};

// User List API Functions
export const createUserList = async (name, description = null) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/user-lists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      description
    })
  });

  if (!response.ok) {
    throw new Error("Failed to create list");
  }

  return await response.json();
};

export const getUserLists = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/user-lists`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch lists");
  }

  return await response.json();
};

export const getUserList = async (listId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/user-lists/${listId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch list");
  }

  return await response.json();
};

export const updateUserList = async (listId, name = null, description = null) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/user-lists/${listId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      description
    })
  });

  if (!response.ok) {
    throw new Error("Failed to update list");
  }

  return await response.json();
};

export const deleteUserList = async (listId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/user-lists/${listId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to delete list");
  }

  return await response.json();
};

export const addGameToList = async (listId, gameId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/user-lists/${listId}/games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      game_id: gameId
    })
  });

  if (!response.ok) {
    throw new Error("Failed to add game to list");
  }

  return await response.json();
};

export const removeGameFromList = async (listId, gameId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/user-lists/${listId}/games/${gameId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to remove game from list");
  }

  return await response.json();
};

// Search API
export const searchGames = async (query, category = "all", limit = 50, offset = 0) => {
  try {
    // Handle common platform abbreviations when searching in the platforms category
    let searchQuery = query;

    if (category === "platforms") {
      // Map of common abbreviations to full platform names
      const platformAbbreviations = {
        "ps5": "PlayStation 5",
        "ps4": "PlayStation 4",
        "ps3": "PlayStation 3",
        "ps2": "PlayStation 2",
        "ps1": "PlayStation",
        "xsx": "Xbox Series X|S",
        "xbone": "Xbox One",
        "xb360": "Xbox 360",
        "xbox": "Xbox",
        "switch": "Nintendo Switch",
        "wiiu": "Wii U",
        "3ds": "Nintendo 3DS",
        "pc": "PC (Microsoft Windows)"
      };

      // Convert query to lowercase for case-insensitive matching
      const queryLower = query.toLowerCase();

      // Replace abbreviation with full name if it exists in mapping
      if (platformAbbreviations[queryLower]) {
        searchQuery = platformAbbreviations[queryLower];
      }
    }

    const response = await fetch(`${BASE_URL}/search?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(category)}&limit=${limit}&offset=${offset}`);

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const data = await response.json();
    return normalizeGamesData(data);
  } catch (error) {
    console.error("Error searching games:", error);
    return [];
  }
};

export const searchCount = async (query, category = "all") => {
  try {
    const response = await fetch(`${BASE_URL}/search/count?query=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.total || 0;
  } catch (error) {
    console.error("Error fetching search count:", error);
    return 0;
  }
};

// ============================================
// Integration API Functions
// ============================================

/**
 * Fetch integration status for all platforms
 * GET /integrations/status
 */
export const fetchIntegrationStatus = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/status`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch integration status");
  }

  return await response.json();
};

/**
 * Unlink a platform (Steam/PSN)
 * DELETE /integrations/{platform}/unlink
 */
export const unlinkPlatform = async (platform) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/${platform}/unlink`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to unlink ${platform}`);
  }

  return await response.json();
};

/**
 * Get Steam auth URL for OAuth flow
 * GET /integrations/steam/auth-url
 */
export const getSteamAuthUrl = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const returnUrl = `${window.location.origin}/settings?tab=integrations&steam_callback=true`;
  const response = await fetch(`${BASE_URL}/integrations/steam/auth-url?return_url=${encodeURIComponent(returnUrl)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to get Steam auth URL");
  }

  return await response.json();
};

/**
 * Link Steam account with OpenID params
 * POST /integrations/steam/link
 */
export const linkSteamAccount = async (openidParams) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/steam/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(openidParams)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to link Steam account");
  }

  return await response.json();
};

/**
 * Link PSN account with username
 * POST /integrations/psn/link
 */
export const linkPSNAccount = async (username) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/psn/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ username })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to link PSN account");
  }

  return await response.json();
};

/**
 * Preview a PSN profile before linking
 */
export const previewPSNProfile = async (username) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/psn/preview/${encodeURIComponent(username)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Profile not found or is private");
  }

  return await response.json();
};

/**
 * Clear all games from user's library
 * DELETE /user-games/all
 */
export const clearAllGames = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/user-games/all`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Failed to clear library");
  }

  return await response.json();
};

/**
 * Clear PSN cache (for testing/debugging)
 * DELETE /integrations/psn/cache
 */
export const clearPsnCache = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/psn/cache`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to clear PSN cache");
  }

  return await response.json();
};

/**
 * Clear Steam cache
 * DELETE /integrations/steam/cache
 */
export const clearSteamCache = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/steam/cache`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to clear Steam cache");
  }

  return await response.json();
};

// ============================================
// Sync Review API (PSN & Steam)
// ============================================


/**
 * Get PSN library (cached)
 */
export const getPSNLibrary = async (includeHidden = false) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/psn/library?include_hidden=${includeHidden}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    // Get actual error detail from backend (e.g., "No PSN account linked")
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch PSN library");
  }

  return await response.json();
};

/**
 * Sync PSN library from PSN API
 */
export const syncPSNLibrary = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/psn/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to sync PSN library");
  }

  return await response.json();
};

/**
 * Import PSN games to library
 */
export const importPSNGames = async (games) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/psn/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ games })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to import PSN games");
  }

  return await response.json();
};

/**
 * Hide a PSN game
 */
export const skipPSNGame = async (platformId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/psn/preferences/skip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ platform_id: platformId })
  });

  if (!response.ok) throw new Error("Failed to skip game");
  return await response.json();
};

/**
 * Manually match a PSN game
 */
export const fixPSNMatch = async (platformId, igdbId, igdbName = null, igdbCoverUrl = null) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/psn/preferences/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      platform_id: platformId,
      igdb_id: igdbId,
      igdb_name: igdbName,
      igdb_cover_url: igdbCoverUrl
    })
  });

  if (!response.ok) throw new Error("Failed to fix match");
  return await response.json();
};

/**
 * Restore a hidden PSN game
 */
export const restorePSNGame = async (platformId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/psn/preferences/${encodeURIComponent(platformId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error("Failed to restore game");
  return await response.json();
};

/**
 * Preview Steam profile before linking
 * GET /integrations/steam/preview/{identifier}
 */
export const previewSteamProfile = async (identifier) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/steam/preview/${encodeURIComponent(identifier)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Profile not found");
  }

  return await response.json();
};

/**
 * Get Steam linked library games (cached)
 */

export const getSteamLibrary = async (includeHidden = false) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/steam/library?include_hidden=${includeHidden}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch Steam library");
  }

  return await response.json();
};

/**
 * Sync Steam library from Steam API
 */
export const syncSteamLibrary = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/steam/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to sync Steam library");
  }

  return await response.json();
};

/**
 * Import Steam games directly to library
 */
export const importSteamGames = async (games) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/steam/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ games })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to import Steam games");
  }

  return await response.json();
};

/**
 * Hide a Steam game
 */
export const skipSteamGame = async (platformId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/steam/preferences/skip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ platform_id: platformId })
  });

  if (!response.ok) throw new Error("Failed to skip game");
  return await response.json();
};

/**
 * Manually match a Steam game
 */
export const fixSteamMatch = async (platformId, igdbId, igdbName = null, igdbCoverUrl = null) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/steam/preferences/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      platform_id: platformId,
      igdb_id: igdbId,
      igdb_name: igdbName,
      igdb_cover_url: igdbCoverUrl
    })
  });

  if (!response.ok) throw new Error("Failed to fix match");
  return await response.json();
};

/**
 * Restore a hidden Steam game
 */
export const restoreSteamGame = async (platformId) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/steam/preferences/${encodeURIComponent(platformId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error("Failed to restore game");
  return await response.json();
};

/**
 * Link Steam account manually via ID, URL or vanity name
 */
export const linkSteamManual = async (identifier) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/integrations/steam/link-manual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ identifier })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to link Steam account");
  }

  return await response.json();
};
