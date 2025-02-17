// src/store/useGameStore.js
import { create } from "zustand";
import { fetchTrendingGames, fetchAnticipatedGames, fetchHighlyRatedGames, fetchLatestGames, fetchGameDetails, fetchGameTimeToBeat } from "../../api";
import { transformGameData } from "../utils/transformGameData";

const useGameStore = create((set, get) => ({
  games: [],
  trendingGames: [],
  gameDetails: {},
  anticipatedGames: [],
  highlyRatedGames: [],
  latestGames: [],
  gameTimeToBeat: {},

  // Fetch Latest Games - Always fetch fresh data
  fetchLatestGames: async () => {
    try {
      const data = await fetchLatestGames();
      set({ latestGames: data.map(transformGameData) });
    } catch (error) {
      console.error("Error fetching latest games:", error);
      set({ latestGames: [] });
    }
  },

  // Fetch Trending Games
  fetchTrendingGames: async () => {
    try {
      const data = await fetchTrendingGames();
      set({ trendingGames: data.map(transformGameData) }); 
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
    } catch (error) {
      console.error("Error fetching highly rated games:", error);
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
