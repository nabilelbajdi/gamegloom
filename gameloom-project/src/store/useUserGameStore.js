import { create } from "zustand";
import { addGameToCollection, removeGameFromCollection, updateGameStatus, fetchUserCollection } from "../api";

const useUserGameStore = create((set, get) => ({
  collection: {
    want_to_play: [],
    playing: [],
    played: []
  },
  isLoading: false,
  error: null,

  // Fetch user's collection
  fetchCollection: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchUserCollection();
      set({ collection: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Add game to collection
  addGame: async (gameId, status) => {
    set({ isLoading: true, error: null });
    try {
      await addGameToCollection(gameId, status);
      await get().fetchCollection();
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Update game status
  updateStatus: async (gameId, newStatus) => {
    set({ isLoading: true, error: null });
    try {
      await updateGameStatus(gameId, newStatus);
      await get().fetchCollection();
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Remove game from collection
  removeGame: async (gameId) => {
    set({ isLoading: true, error: null });
    try {
      await removeGameFromCollection(gameId);
      await get().fetchCollection();
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Get game status in collection
  getGameStatus: (gameId) => {
    const { collection } = get();
    for (const [status, games] of Object.entries(collection)) {
      if (games.some(game => game.id === gameId)) {
        return status;
      }
    }
    return null;
  }
}));

export default useUserGameStore; 