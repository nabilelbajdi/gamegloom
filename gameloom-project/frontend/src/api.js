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

// Fetch Games by Genre or Theme
export const fetchGamesByGenre = (genreSlug) => fetchGames(`games?genre=${genreSlug}`);
export const fetchGamesByTheme = (themeSlug) => fetchGames(`games?theme=${themeSlug}`);

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
export const createReview = async (gameId, rating, content) => {
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
      content
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Failed to create review");
  }

  return data;
};

export const updateReview = async (reviewId, rating, content) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ rating, content })
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
export const searchGames = async (query, category = "all", limit = 6) => {
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
    
    const response = await fetch(`${BASE_URL}/search?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(category)}&limit=${limit}`);
    
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
