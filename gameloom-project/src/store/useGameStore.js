import { create } from "zustand";
import { fetchTrendingGames, fetchAnticipatedGames, fetchHighlyRatedGames, fetchLatestGames, fetchGameDetails, fetchGameTimeToBeat } from "../../api";

const useGameStore = create((set, get) => ({
  games: JSON.parse(localStorage.getItem("games")) || [],
  gameDetails: JSON.parse(localStorage.getItem("gameDetails")) || {},
  anticipatedGames: JSON.parse(localStorage.getItem("anticipatedGames")) || [],
  highlyRatedGames: JSON.parse(localStorage.getItem("highlyRatedGames")) || [],
  latestGames: JSON.parse(localStorage.getItem("latestGames")) || [],
  gameTimeToBeat: JSON.parse(localStorage.getItem("gameTimeToBeat")) || {},


  // Fetch Trending Games
  fetchTrendingGames: async () => {
    if (get().games.length > 0) return;
    try {
      const data = await fetchTrendingGames();
      set({ games: data });
      localStorage.setItem("games", JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching trending games:", error);
    }
  },

    // Fetch Anticipated Games
    fetchAnticipatedGames: async () => {
      if (get().anticipatedGames.length > 0) return;
      try {
        const data = await fetchAnticipatedGames();
        set({ anticipatedGames: data });
        localStorage.setItem("anticipatedGames", JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching anticipated games:", error);
      }
    },
  
    // Fetch Highly Rated Games
    fetchHighlyRatedGames: async () => {
      if (get().highlyRatedGames.length > 0) return;
      try {
        const data = await fetchHighlyRatedGames();
        set({ highlyRatedGames: data });
        localStorage.setItem("highlyRatedGames", JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching highly rated games:", error);
      }
    },
  
    // Fetch Latest Games
    fetchLatestGames: async () => {
      if (get().latestGames.length > 0) return;
      try {
        const data = await fetchLatestGames();
        set({ latestGames: data });
        localStorage.setItem("latestGames", JSON.stringify(data));
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
        localStorage.setItem("gameTimeToBeat", JSON.stringify(get().gameTimeToBeat));
      } catch (error) {
        console.error(`Error fetching time to beat for game ${gameId}:`, error);
      }
    },

  fetchGameDetails: async (gameId) => {
    if (get().gameDetails[gameId]) return;
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
