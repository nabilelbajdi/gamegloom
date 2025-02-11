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
      steamPeakPlayers: game.steamPeakPlayers || 0,
    }));
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
    
    const data = await response.json();
    if (!data) return null;

    const rawTimestamp = data.first_release_date;
    const isValidDate = rawTimestamp && !isNaN(rawTimestamp) && rawTimestamp > 0;

    // Fetch details for similar games
    const similarGames = data.similar_games ? await Promise.all(
      data.similar_games.map(async (similarGameId) => {
        const response = await fetch(`${BASE_URL}/games/${similarGameId}`);
        if (!response.ok) return null;
        const similarGameData = await response.json();
        return {
          id: similarGameData.id,
          title: similarGameData.name,
          genre: similarGameData.genres?.[0]?.name || "Unknown",
          rating: similarGameData.rating ? (similarGameData.rating / 20).toFixed(1) : "N/A",
          coverImage: similarGameData.cover?.image_id 
            ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${similarGameData.cover.image_id}.jpg`
            : "",
        };
      })
    ) : [];

    // Fetch games by the same developer
    const developerName = data.involved_companies?.[0]?.company?.name || null;
    const gamesBySameDeveloper = developerName ? await fetchGamesByDeveloper(developerName) : [];

    return {
      id: data.id,
      name: data.name,
      summary: data.summary || "No summary available.",
      storyline: data.storyline || "No storyline available.",
      releaseDate: isValidDate 
        ? new Date(rawTimestamp).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : "TBA",
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
      similarGames: similarGames.filter(game => game !== null),
      developers: data.involved_companies?.map(c => c.company.name).join(" • "),
      gameModes: data.game_modes?.map(m => m.name).join(", ") || "Unknown",
      playerPerspectives: data.player_perspectives?.map(p => p.name).join(", ") || "Unknown",
      themes: data.themes?.map(t => t.name).join(", "),
      gamesBySameDeveloper,
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

export const fetchGamesByDeveloper = async (developerName) => {
  try {
    const response = await fetch(`${BASE_URL}/games-by-developer/${encodeURIComponent(developerName)}`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching games by developer:", error);
    return [];
  }
};