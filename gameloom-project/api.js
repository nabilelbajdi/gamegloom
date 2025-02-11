const BASE_URL = "http://localhost:8000"; 

// Fetch list of games
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

export const fetchAnticipatedGames = () => fetchGames("anticipated-games");
export const fetchHighlyRatedGames = () => fetchGames("highly-rated-games");
export const fetchLatestGames = () => fetchGames("latest-games");

// Fetch single game details
export const fetchGameDetails = async (gameId) => {
  try {
    const response = await fetch(`${BASE_URL}/games/${gameId}`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      summary: data.summary || "No summary available.",
      storyline: data.storyline || "No storyline available.",
      releaseDate: data.first_release_date
        ? new Date(data.first_release_date * 1000).toLocaleDateString()
        : "Unknown Release Date",
      coverImage: data.cover?.image_id
        ? `https://images.igdb.com/igdb/image/upload/t_1080p/${data.cover.image_id}.jpg`
        : null,
      screenshots: data.screenshots?.map(s => 
        `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${s.image_id}.jpg`
      ) || [],
      videos: data.videos?.map(v => 
        `https://www.youtube.com/embed/${v.video_id}`
      ) || [],
      genres: data.genres?.map(g => g.name).join(", "),
      platforms: data.platforms?.map(p => p.name).join(", ") || "Unknown",
      rating: data.rating ? (data.rating / 20).toFixed(1) : "N/A",
      aggregatedRating: data.aggregated_rating ? (data.aggregated_rating / 20).toFixed(1) : "N/A",
      totalRatings: data.total_rating_count || 0,
      hypes: data.hypes || 0,
      similarGames: data.similar_games || [],
      developers: data.involved_companies?.map(c => c.company.name).join(" • "),
      gameModes: data.game_modes?.map(m => m.name).join(", ") || "Unknown",
      playerPerspectives: data.player_perspectives?.map(p => p.name).join(", ") || "Unknown",
      themes: data.themes?.map(t => t.name).join(", "),
    };
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