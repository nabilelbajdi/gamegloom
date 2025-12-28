import { create } from "zustand";
import { addGameToCollection, removeGameFromCollection, updateGameStatus, fetchUserCollection, fetchGameDetails } from "../api";

const useUserGameStore = create((set, get) => ({
  collection: {
    want_to_play: [],
    playing: [],
    played: []
  },
  isLoading: false,
  loadingGameIds: [],
  error: null,
  lastFetched: null, // Cache timestamp

  // Fetch user's collection with caching
  fetchCollection: async (forceRefresh = false) => {
    const { lastFetched, isLoading } = get();

    // Skip if already loading
    if (isLoading) return;

    // Skip if cached within 5 minutes (unless forced)
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    if (!forceRefresh && lastFetched && (Date.now() - lastFetched) < CACHE_DURATION) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await fetchUserCollection();
      set({ collection: data, isLoading: false, lastFetched: Date.now() });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Add game to collection
  addGame: async (gameId, status) => {
    set(state => ({
      loadingGameIds: [...state.loadingGameIds, gameId],
      error: null
    }));

    try {
      const response = await addGameToCollection(gameId, status);

      // Update the local state without fetching the entire collection
      const { collection } = get();
      const updatedCollection = { ...collection };

      // Ensure the status array exists
      if (!updatedCollection[status]) {
        updatedCollection[status] = [];
      }

      // If no game details, fetch them
      const gameDetailsFromResponse = response.game || null;
      const gameDetails = gameDetailsFromResponse || await fetchGameDetails(gameId);

      // Add the normalized game to the collection with consistent ID
      if (gameDetails) {
        const gameToAdd = {
          ...gameDetails,
          // Ensure both id and igdb_id are set to the same value for consistency
          id: gameId,
          igdb_id: gameId,
          status,
          added_at: new Date().toISOString()
        };

        updatedCollection[status] = [...updatedCollection[status], gameToAdd];
      }

      set(state => ({
        collection: updatedCollection,
        loadingGameIds: state.loadingGameIds.filter(id => id !== gameId),
        lastFetched: Date.now() // Update cache timestamp
      }));
    } catch (error) {
      set(state => ({
        error: error.message,
        loadingGameIds: state.loadingGameIds.filter(id => id !== gameId)
      }));
    }
  },

  // Update game status
  updateStatus: async (gameId, newStatus) => {
    set(state => ({
      loadingGameIds: [...state.loadingGameIds, gameId],
      error: null
    }));

    try {
      await updateGameStatus(gameId, newStatus);

      // Update the store locally
      const { collection } = get();
      const updatedCollection = { ...collection };

      // Find the game in the current collection
      let gameToUpdate = null;
      let oldStatus = null;

      for (const [status, games] of Object.entries(updatedCollection)) {
        const gameIndex = games.findIndex(game => game.id === gameId);
        if (gameIndex !== -1) {
          gameToUpdate = { ...games[gameIndex], status: newStatus };
          oldStatus = status;
          updatedCollection[status] = games.filter(game => game.id !== gameId);
          break;
        }
      }

      if (gameToUpdate) {
        if (!updatedCollection[newStatus]) {
          updatedCollection[newStatus] = [];
        }
        updatedCollection[newStatus] = [...updatedCollection[newStatus], gameToUpdate];
      }

      set(state => ({
        collection: updatedCollection,
        loadingGameIds: state.loadingGameIds.filter(id => id !== gameId),
        lastFetched: Date.now()
      }));
    } catch (error) {
      await get().fetchCollection(true);

      set(state => ({
        error: error.message,
        loadingGameIds: state.loadingGameIds.filter(id => id !== gameId)
      }));
    }
  },

  // Remove game from collection
  removeGame: async (gameId) => {
    set(state => ({
      loadingGameIds: [...state.loadingGameIds, gameId],
      error: null
    }));

    try {
      await removeGameFromCollection(gameId);

      const { collection } = get();
      const updatedCollection = { ...collection };

      for (const status of Object.keys(updatedCollection)) {
        updatedCollection[status] = updatedCollection[status].filter(game => game.id !== gameId);
      }

      set(state => ({
        collection: updatedCollection,
        loadingGameIds: state.loadingGameIds.filter(id => id !== gameId),
        lastFetched: Date.now()
      }));
    } catch (error) {
      await get().fetchCollection(true);

      set(state => ({
        error: error.message,
        loadingGameIds: state.loadingGameIds.filter(id => id !== gameId)
      }));
    }
  },

  // Get game status in collection - checks both id and igdb_id for robustness
  getGameStatus: (gameId) => {
    const { collection } = get();
    for (const [status, games] of Object.entries(collection)) {
      if (games.some(game => game.id === gameId || game.igdb_id === gameId)) {
        return status;
      }
    }
    return null;
  },

  isGameLoading: (gameId) => {
    return get().loadingGameIds.includes(gameId);
  },

  // Clear collection on logout
  clearCollection: () => {
    set({
      collection: {
        want_to_play: [],
        playing: [],
        played: []
      },
      loadingGameIds: [],
      error: null,
      lastFetched: null
    });
  }
}));

export default useUserGameStore;