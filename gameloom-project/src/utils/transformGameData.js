// src/utils/transformGameData.js
// This file is used to transform the game data from the API response to the format we want to use in the app

export const transformGameData = (game) => {
    if (!game) return null;
    
    let rating = "N/A";
    if (game.total_rating) rating = (game.total_rating / 20).toFixed(1);
  
    return {
      // Basic Info
      id: game.igdb_id,
      igdb_id: game.igdb_id,
      name: game.name,

      // Media
      coverImage: game.cover_image,
      screenshots: game.screenshots,
      videos: game.videos,

      // Game Details
      genres: game.genres,
      rating,
      summary: game.summary,
      storyline: game.storyline,
      platforms: game.platforms,
      firstReleaseDate: game.first_release_date,

      // Similar Games (nested transformation)
      similarGames: game.similar_games?.map(similar => ({
        id: similar.id,
        igdb_id: similar.id,
        name: similar.name,
        coverImage: similar.cover_image,
        rating: similar.rating ? (similar.rating / 20).toFixed(1) : "N/A",
        genres: similar.genres
      })) || [],

      // Additional Details
      developers: game.developers,
      gameModes: game.game_modes,
      playerPerspectives: game.player_perspectives,
      themes: game.themes,
      totalRatingCount: game.total_rating_count
    };
  };