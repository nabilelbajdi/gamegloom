// src/store/useGameStore.js
import { create } from "zustand";
import { 
  fetchTrendingGames, fetchAnticipatedGames, fetchHighlyRatedGames, 
  fetchLatestGames, fetchGameDetails, fetchGamesByGenre, fetchGamesByTheme,
  fetchRecommendations
} from "../api";
import { transformGameData } from "../utils/transformGameData";

const useGameStore = create((set, get) => ({
  games: [],
  trendingGames: [],
  gameDetails: {},
  anticipatedGames: [],
  highlyRatedGames: [],
  latestGames: [],
  genreGames: {},
  themeGames: {},
  recommendedGames: [],

  fetchTopGamesForGenre: async (genreSlug, limit = 3) => {
    try {
      const existingGames = get().genreGames[genreSlug];
      if (existingGames && existingGames.length >= limit) {
        return existingGames.slice(0, limit);
      }
      
      const data = await fetchGamesByGenre(genreSlug);
      
      if (data && data.length > 0) {
        const transformedGames = data.map(transformGameData);
        
        set((state) => ({
          genreGames: {
            ...state.genreGames,
            [genreSlug]: transformedGames
          }
        }));
        
        return transformedGames.slice(0, limit);
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching top games for genre ${genreSlug}:`, error);
      return [];
    }
  },
  
  fetchTopGamesForTheme: async (themeSlug, limit = 3) => {
    try {
      const existingGames = get().themeGames[themeSlug];
      if (existingGames && existingGames.length >= limit) {
        return existingGames.slice(0, limit);
      }
      
      const data = await fetchGamesByTheme(themeSlug);
      
      if (data && data.length > 0) {
        const transformedGames = data.map(transformGameData);
        
        set((state) => ({
          themeGames: {
            ...state.themeGames,
            [themeSlug]: transformedGames
          }
        }));
        
        return transformedGames.slice(0, limit);
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching top games for theme ${themeSlug}:`, error);
      return [];
    }
  },

  fetchGames: async (categoryType, filter = null) => {
    try {
      let data;
      switch (categoryType) {
        case "trending":
          data = await fetchTrendingGames();
          break;
        case "anticipated":
          data = await fetchAnticipatedGames();
          break;
        case "highlyRated":
          data = await fetchHighlyRatedGames();
          break;
        case "latest":
          data = await fetchLatestGames();
          break;
        case "genre":
          data = await fetchGamesByGenre(filter);
          break;
        case "theme":
          data = await fetchGamesByTheme(filter);
          break;
        case "recommendations":
          data = await fetchRecommendations();
          break;
        default:
          data = [];
      }

      if (data && data.length > 0) {
        const transformedGames = data.map(transformGameData);
        
        set((state) => {
          switch (categoryType) {
            case "trending":
              return { trendingGames: transformedGames };
            case "anticipated":
              return { anticipatedGames: transformedGames };
            case "highlyRated":
              return { highlyRatedGames: transformedGames };
            case "latest":
              return { latestGames: transformedGames };
            case "genre":
              return {
                genreGames: {
                  ...state.genreGames,
                  [filter]: transformedGames
                }
              };
            case "theme":
              return {
                themeGames: {
                  ...state.themeGames,
                  [filter]: transformedGames
                }
              };
            case "recommendations":
              return { recommendedGames: transformedGames };
            default:
              return state;
          }
        });
      }
    } catch (error) {
      console.error(`Error fetching ${categoryType} games:`, error);
    }
  },

  // Fetch Single Game Details
  fetchGameDetails: async (igdbId) => {
    if (get().gameDetails[igdbId]) return;

    try {
      const data = await fetchGameDetails(igdbId);
      if (data) {
        const transformedData = transformGameData(data);
        set((state) => ({
          gameDetails: { ...state.gameDetails, [igdbId]: transformedData },
        }));
      }
    } catch (error) {
      console.error(`Error fetching game ${igdbId} details:`, error);
    }
  },
}));

export default useGameStore;
