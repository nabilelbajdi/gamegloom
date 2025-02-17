// api.js
const BASE_URL = "http://localhost:8000/api/v1"; 

// Generic fetch function for all game-related endpoints
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

// Game list endpoints
export const fetchAnticipatedGames = () => fetchGames("anticipated-games");
export const fetchHighlyRatedGames = () => fetchGames("highly-rated-games");
export const fetchLatestGames = () => fetchGames("latest-games");
export const fetchTrendingGames = () => fetchGames("trending-games");

// Single game endpoints
export const fetchGameDetails = (gameId) => fetchGames(`games/${gameId}`);
export const fetchGameTimeToBeat = (gameId) => fetchGames(`game-time-to-beat/${gameId}`);

// Fetch games by developer
export const fetchGamesByDeveloper = async (developerName) => {
  const data = await fetchGames(`games-by-developer/${encodeURIComponent(developerName)}`);
  if (!data) return [];
  
  return data.map((game) => ({
    id: game.id,
    name: game.title,
    genre: game.genre || "Unknown",
    rating: game.rating || "N/A",
    coverImage: game.coverImage || "",
  }));
};
