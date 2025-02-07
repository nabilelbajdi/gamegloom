const BASE_URL = "http://localhost:8000"; 

async function fetchGames(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.map((game) => ({
      id: game.id,
      title: game.name,
      genre: game.genres?.[0]?.name || "Unknown",
      rating: game.rating ? (game.rating / 20).toFixed(1) : "N/A",
      coverImage: game.cover?.url.replace("t_thumb", "t_cover_big") || "",
    }));
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return [];
  }
}

export const fetchGameDetails = async (gameId) => {
  try {
    const response = await fetch(`${BASE_URL}/games/${gameId}`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();
    // IGDB returns an array; we take the first (and only) item.
    return data[0];
  } catch (error) {
    console.error("Error fetching game details:", error);
    return null;
  }
};

export const fetchAnticipatedGames = () => fetchGames("anticipated-games");
export const fetchHighlyRatedGames = () => fetchGames("highly-rated-games");
export const fetchLatestGames = () => fetchGames("latest-games");