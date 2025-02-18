// src/store/useGameStore.js
import { create } from "zustand";
import { 
  fetchTrendingGames, fetchAnticipatedGames, fetchHighlyRatedGames, 
  fetchLatestGames, fetchGameDetails, fetchGameTimeToBeat 
} from "../../api";
import { transformGameData } from "../utils/transformGameData";

const useGameStore = create((set, get) => ({
  games: [],
  trendingGames: [],
  gameDetails: {},
  anticipatedGames: [],
  highlyRatedGames: [],
  latestGames: [],
  gameTimeToBeat: {},

  // Fetch Games
  fetchGames: async (type) => {
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
  fetchGameDetails: async (gameId) => {
    if (get().gameDetails[gameId]) return;

    try {
      const data = await fetchGameDetails(gameId);
      if (data) {
        set((state) => ({
          gameDetails: { ...state.gameDetails, [gameId]: transformGameData(data) },
        }));
      }
    } catch (error) {
      console.error(`Error fetching game ${gameId} details:`, error);
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
}));

export default useGameStore;
