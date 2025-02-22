// src/api.js
const BASE_URL = "http://localhost:8000/api/v1"; 

// Centralized Fetch Games
async function fetchGames(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

// Fetch Games by Type
export const fetchAnticipatedGames = () => fetchGames("anticipated-games");
export const fetchHighlyRatedGames = () => fetchGames("highly-rated-games");
export const fetchLatestGames = () => fetchGames("latest-games");
export const fetchTrendingGames = () => fetchGames("trending-games");

// Fetch Multiple Game Details
export const fetchMultipleGameDetails = async (gameIds) => {
  if (!gameIds || gameIds.length === 0) return [];
  return await fetchGames(`games?ids=${gameIds.join(",")}`);
};

// Fetch Single Game Details
export const fetchGameDetails = (gameId) => fetchGames(`games/${gameId}`);
export const fetchGameTimeToBeat = (gameId) => fetchGames(`game-time-to-beat/${gameId}`);

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
