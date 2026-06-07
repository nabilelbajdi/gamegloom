// src/store/useGameStore.js
import { create } from "zustand";
import {
  fetchTrendingGames, fetchAnticipatedGames, fetchHighlyRatedGames,
  fetchLatestGames, fetchGameDetails, fetchGamesByGenre, fetchGamesByTheme,
  fetchRecommendations, fetchGameCount
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
  // Per-section load status keyed by category ("trending", "genre:rpg", ...):
  // "loading" | "success" | "error". Lets carousels show a retry instead of a
  // silent blank when a fetch fails.
  categoryStatus: {},

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
    const statusKey = filter ? `${categoryType}:${filter}` : categoryType;
    const setStatus = (s) =>
      set((state) => ({ categoryStatus: { ...state.categoryStatus, [statusKey]: s } }));
    setStatus("loading");
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
          data = await fetchGamesByGenre(filter, 50, 0);
          break;
        case "theme":
          data = await fetchGamesByTheme(filter, 50, 0);
          break;
        case "recommendations":
          data = await fetchRecommendations();
          break;
        default:
          data = [];
      }

      // api returns null on a real failure (vs [] for an empty-but-successful result).
      if (data === null || data === undefined) {
        setStatus("error");
        return null;
      }

      if (data.length > 0) {
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

      setStatus("success");
      return data.length; // Return count for hasMore check
    } catch (error) {
      console.error(`Error fetching ${categoryType} games:`, error);
      setStatus("error");
      return null;
    }
  },

  // Load more games with offset (for pagination)
  loadMoreGames: async (categoryType, filter = null, currentCount = 0) => {
    try {
      let data;
      const limit = 50;
      const offset = currentCount;

      switch (categoryType) {
        case "genre":
          data = await fetchGamesByGenre(filter, limit, offset);
          break;
        case "theme":
          data = await fetchGamesByTheme(filter, limit, offset);
          break;
        default:
          return 0; // Only genre/theme support load more for now
      }

      if (data && data.length > 0) {
        const transformedGames = data.map(transformGameData);

        set((state) => {
          if (categoryType === "genre") {
            const existingGames = state.genreGames[filter] || [];
            return {
              genreGames: {
                ...state.genreGames,
                [filter]: [...existingGames, ...transformedGames]
              }
            };
          } else if (categoryType === "theme") {
            const existingGames = state.themeGames[filter] || [];
            return {
              themeGames: {
                ...state.themeGames,
                [filter]: [...existingGames, ...transformedGames]
              }
            };
          }
          return state;
        });

        return data.length; // Return count for hasMore check
      }
      return 0;
    } catch (error) {
      console.error(`Error loading more ${categoryType} games:`, error);
      return 0;
    }
  },

  // Fetch Single Game Details. Pass forceRefresh to bypass the cache (e.g. after
  // a review changes the game's blended rating).
  fetchGameDetails: async (identifier, forceRefresh = false) => {
    const gameDetails = get().gameDetails;

    if (!forceRefresh) {
      // If identifier is a number (IGDB ID), check if we already have it
      if (!isNaN(identifier)) {
        const numericId = parseInt(identifier);
        if (gameDetails[numericId]) return true;
      } else {
        // If identifier is a slug, check if we have any game with this slug
        const foundGame = Object.values(gameDetails).find(g => g.slug === identifier);
        if (foundGame) return true;
      }
    }

    // Returns true when the game is available, false on a missing game or fetch
    // failure, so callers can show an error instead of an endless skeleton.
    try {
      const data = await fetchGameDetails(identifier);
      if (data) {
        const transformedData = transformGameData(data);
        set((state) => ({
          gameDetails: {
            ...state.gameDetails,
            [data.igdb_id]: transformedData
          },
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error fetching game ${identifier} details:`, error);
      return false;
    }
  },
}));

export default useGameStore;
