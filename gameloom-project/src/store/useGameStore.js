// src/store/useGameStore.js
import { create } from "zustand";
import { 
  fetchTrendingGames, fetchAnticipatedGames, fetchHighlyRatedGames, 
  fetchLatestGames, fetchGameDetails, fetchGamesByGenre, fetchGamesByTheme
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

  fetchGames: async (type, filterSlug) => {
    if (type === "genre" && filterSlug) {
      if (get().genreGames[filterSlug]?.length > 0) return;

      try {
        const data = await fetchGamesByGenre(filterSlug);
        set((state) => ({
          genreGames: { 
            ...state.genreGames,
            [filterSlug]: data.map(transformGameData)
          }
        }));
      } catch (error) {
        console.error(`Error fetching games for genre ${filterSlug}:`, error);
        set((state) => ({
          genreGames: { 
            ...state.genreGames,
            [filterSlug]: []
          }
        }));
      }
      return;
    }
    
    if (type === "theme" && filterSlug) {
      if (get().themeGames[filterSlug]?.length > 0) return;

      try {
        const data = await fetchGamesByTheme(filterSlug);
        set((state) => ({
          themeGames: { 
            ...state.themeGames,
            [filterSlug]: data.map(transformGameData)
          }
        }));
      } catch (error) {
        console.error(`Error fetching games for theme ${filterSlug}:`, error);
        set((state) => ({
          themeGames: { 
            ...state.themeGames,
            [filterSlug]: []
          }
        }));
      }
      return;
    }

    const stateKey = `${type}Games`;
    if (get()[stateKey].length > 0) return;

    try {
      let fetchFunction;
      switch (type) {
        case "trending": fetchFunction = fetchTrendingGames; break;
        case "anticipated": fetchFunction = fetchAnticipatedGames; break;
        case "highlyRated": fetchFunction = fetchHighlyRatedGames; break;
        case "latest": fetchFunction = fetchLatestGames; break;
        default: throw new Error(`Unknown fetch type: ${type}`);
      }

      const data = await fetchFunction();
      set({ [stateKey]: data.map(transformGameData) });
    } catch (error) {
      console.error(`Error fetching ${type} games:`, error);
      set({ [stateKey]: [] });
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
