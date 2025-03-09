// src/store/useGameStore.js
import { create } from "zustand";
import { 
  fetchTrendingGames, fetchAnticipatedGames, fetchHighlyRatedGames, 
  fetchLatestGames, fetchGameDetails
} from "../api";
import { transformGameData } from "../utils/transformGameData";

const useGameStore = create((set, get) => ({
  games: [],
  trendingGames: [],
  gameDetails: {},
  anticipatedGames: [],
  highlyRatedGames: [],
  latestGames: [],

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
