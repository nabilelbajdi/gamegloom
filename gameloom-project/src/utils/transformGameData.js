// src/utils/transformGameData.js
// This file is used to transform the game data from the API response to the format we want to use in the app

export const transformGameData = (game) => {
    if (!game) return null;
    
    let rating = "N/A";
    if (game.total_rating) {
      rating = (game.total_rating / 20).toFixed(1);
    }
    else if (game.rating) {
      rating = (game.rating / 20).toFixed(1);
    }
  
    return {
      id: game.igdb_id || game.id,
      igdb_id: game.igdb_id || game.id,
      name: game.name,
      slug: game.slug,
      coverImage: game.cover_image || game.coverImage,
      screenshots: game.screenshots,
      videos: game.videos,
      artworks: game.artworks,
      genres: game.genres,
      rating,
      summary: game.summary,
      storyline: game.storyline,
      platforms: game.platforms,
      firstReleaseDate: game.first_release_date || game.firstReleaseDate,
      similarGames: game.similar_games?.map(similar => ({
        id: similar.id,
        igdb_id: similar.id,
        name: similar.name,
        slug: similar.slug,
        coverImage: similar.cover_image || similar.coverImage,
        rating: similar.rating ? (similar.rating / 20).toFixed(1) : "N/A",
        genres: similar.genres
      })) || [],
      dlcs: game.dlcs || [],
      expansions: game.expansions || [],
      remakes: game.remakes || [],
      remasters: game.remasters || [],
      bundles: game.bundles || [],
      ports: game.ports || [],
      standalone_expansions: game.standalone_expansions || [],
      episodes: game.episodes || [],
      seasons: game.seasons || [],
      packs: game.packs || [],
      editions: game.editions || [],
      in_bundles: game.in_bundles || [],
      parentGame: game.parent_game || null,
      versionParent: game.version_parent || null,
      versionTitle: game.version_title || null,
      developers: game.developers,
      publishers: game.publishers,
      franchise: game.franchise,
      gameModes: game.game_modes || game.gameModes,
      playerPerspectives: game.player_perspectives || game.playerPerspectives,
      themes: game.themes,
      totalRatingCount: game.total_rating_count || game.totalRatingCount,
      aggregatedRatingCount: game.aggregated_rating_count || game.aggregatedRatingCount,
      time_to_beat: game.time_to_beat,
      game_type_name: game.game_type_name
    };
  };