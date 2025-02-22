// src/utils/transformGameData.js
// This file is used to transform the game data from the API response to the format we want to use in the app

export const transformGameData = (game) => {
    if (!game) return null;
    
    let rating = "N/A";
    if (game.total_rating) rating = (game.total_rating / 20).toFixed(1);
  
    return {
      id: game.igdb_id,
      igdb_id: game.igdb_id,
      name: game.name,
      genres: game.genres,
      rating,
      coverImage: game.cover_image,
      summary: game.summary,
      storyline: game.storyline,
      platforms: game.platforms,
      firstReleaseDate: game.first_release_date,
      screenshots: game.screenshots,
      videos: game.videos,
      similarGames: game.similar_games?.map(similar => ({
        id: similar.id,
        igdb_id: similar.id,
        name: similar.name,
        coverImage: similar.cover_image,
        rating: similar.rating ? (similar.rating / 20).toFixed(1) : "N/A",
        genres: similar.genres
      })) || [],
      developers: game.developers,
      gameModes: game.game_modes,
      playerPerspectives: game.player_perspectives,
      themes: game.themes,
      totalRatingCount: game.total_rating_count
    };
  };