import { create } from "zustand";
import { fetchTrendingGames, fetchGameDetails } from "../../api";

// Zustand Store for Game Data
const useGameStore = create((set, get) => ({
  games: [],          // Stores list of trending games
  gameDetails: {},    // Stores individual game details

  // Fetch trending games (only if not already fetched)
  fetchTrendingGames: async () => {
    if (get().games.length > 0) return; // Prevent duplicate fetches
    try {
      const data = await fetchTrendingGames();
      set({ games: data });
    } catch (error) {
      console.error("Error fetching trending games:", error);
    }
  },

  // Fetch game details and cache them
  fetchGameDetails: async (gameId) => {
    if (get().gameDetails[gameId]) return; // Use cached data
    try {
      const data = await fetchGameDetails(gameId);
      if (data) {
        set((state) => ({
          gameDetails: { ...state.gameDetails, [gameId]: data },
        }));
      }
    } catch (error) {
      console.error(`Error fetching game ${gameId} details:`, error);
    }
  },
}));

export default useGameStore;
