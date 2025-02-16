// api.js
const BASE_URL = "http://localhost:8000/api/v1"; 

// Fetch list of games
async function fetchGames(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return [];
  }
}

export const fetchAnticipatedGames = () => fetchGames("anticipated-games");
export const fetchHighlyRatedGames = () => fetchGames("highly-rated-games");
export const fetchLatestGames = () => fetchGames("latest-games");
export const fetchTrendingGames = () => fetchGames("trending-games");

// Fetch single game details
export const fetchGameDetails = async (gameId) => {
  try {
    const response = await fetch(`${BASE_URL}/games/${gameId}`);
    
    if (response.status === 404) {
      console.warn(`Game with ID ${gameId} not found.`);
      return null;
    }
    
    if (response.status >= 500) {
      console.error(`Server error: ${response.status}`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching game details:", error);
    return null;
  }
};

// Fetch time to beat
export const fetchGameTimeToBeat = async (gameId) => {
  try {
    const response = await fetch(`${BASE_URL}/game-time-to-beat/${gameId}`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching game time to beat:", error);
    return null;
  }
};

// Fetch games by developer
export const fetchGamesByDeveloper = async (developerName) => {
  try {
    const response = await fetch(`${BASE_URL}/games-by-developer/${encodeURIComponent(developerName)}`);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    
    return data.map((game) => ({
      id: game.id,
      name: game.title,
      genre: game.genre || "Unknown",
      rating: game.rating || "N/A",
      coverImage: game.coverImage || "",
    }));
  } catch (error) {
    console.error("Error fetching games by developer:", error);
    return [];
  }
};
