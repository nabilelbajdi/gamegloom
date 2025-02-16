// src/store/useGameStore.js
import { create } from "zustand";
import { fetchTrendingGames, fetchAnticipatedGames, fetchHighlyRatedGames, fetchLatestGames, fetchGameDetails, fetchGameTimeToBeat } from "../../api";

const transformGameData = (game) => {
  // Calculate the rating based on available data
  let rating = "N/A";
  if (game.total_rating) {
    rating = (game.total_rating / 20).toFixed(1);
  } else if (game.rating) {
    rating = (game.rating / 20).toFixed(1);
  } else if (game.aggregated_rating) {
    rating = (game.aggregated_rating / 20).toFixed(1);
  }

  return {
    id: game.igdb_id,
    name: game.name,
    genre: game.genres,
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
      name: similar.name,
      coverImage: similar.cover_image,
      rating: similar.rating ? (similar.rating / 20).toFixed(1) : "N/A",
      genre: similar.genres
    })) || [],
    developers: game.developers,
    gameModes: game.game_modes,
    playerPerspectives: game.player_perspectives,
    themes: game.themes,
    totalRatingCount: game.total_rating_count
  };
};

const useGameStore = create((set, get) => ({
  // games: JSON.parse(localStorage.getItem("games")) || [],
  // trendingGames: JSON.parse(localStorage.getItem("trendingGames")) || [],
  // gameDetails: JSON.parse(localStorage.getItem("gameDetails")) || {},
  // anticipatedGames: JSON.parse(localStorage.getItem("anticipatedGames")) || [],
  // highlyRatedGames: JSON.parse(localStorage.getItem("highlyRatedGames")) || [],
  // latestGames: JSON.parse(localStorage.getItem("latestGames")) || [],
  // gameTimeToBeat: JSON.parse(localStorage.getItem("gameTimeToBeat")) || {},
  games: [],
  trendingGames: [],
  gameDetails: {},
  anticipatedGames: [],
  highlyRatedGames: [],
  latestGames: [],
  gameTimeToBeat: {},


  // Fetch Trending Games
  fetchTrendingGames: async () => {
    if (get().trendingGames.length > 0) return;
    try {
      const data = await fetchTrendingGames();
      set({ trendingGames: data.map(transformGameData) }); 
      // localStorage.setItem("trendingGames", JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching trending games:", error);
    }
  },
  

    // Fetch Anticipated Games
    fetchAnticipatedGames: async () => {
      if (get().anticipatedGames.length > 0) return;
      try {
        const data = await fetchAnticipatedGames();
        set({ anticipatedGames: data.map(transformGameData) });
        // localStorage.setItem("anticipatedGames", JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching anticipated games:", error);
      }
    },
  
    // Fetch Highly Rated Games
    fetchHighlyRatedGames: async () => {
      if (get().highlyRatedGames.length > 0) return;
      try {
        const data = await fetchHighlyRatedGames();
        set({ highlyRatedGames: data.map(transformGameData) });
        // localStorage.setItem("highlyRatedGames", JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching highly rated games:", error);
      }
    },
  
    // Fetch Latest Games
    fetchLatestGames: async () => {
      if (get().latestGames.length > 0) return;
      try {
        const data = await fetchLatestGames();
        set({ latestGames: data.map(transformGameData) });
        // localStorage.setItem("latestGames", JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching latest games:", error);
      }
    },
  
    // Fetch Game Time to Beat
    fetchGameTimeToBeat: async (gameId) => {
      if (get().gameTimeToBeat[gameId]) return;
      try {
        const data = await fetchGameTimeToBeat(gameId);
        set((state) => ({
          gameTimeToBeat: { ...state.gameTimeToBeat, [gameId]: data },
        }));
        // localStorage.setItem("gameTimeToBeat", JSON.stringify(get().gameTimeToBeat));
      } catch (error) {
        console.error(`Error fetching time to beat for game ${gameId}:`, error);
      }
    },

  fetchGameDetails: async (gameId) => {
    if (get().gameDetails[gameId]) return;
    try {
      const data = await fetchGameDetails(gameId);
      if (data) {
        const transformedData = transformGameData(data);
        set((state) => ({
          gameDetails: { ...state.gameDetails, [gameId]: transformedData },
        }));
      }
    } catch (error) {
      console.error(`Error fetching game ${gameId} details:`, error);
    }
  },
}));

export default useGameStore;
