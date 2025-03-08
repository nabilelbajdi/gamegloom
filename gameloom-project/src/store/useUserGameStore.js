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
    set(state => ({ 
      loadingGameIds: [...state.loadingGameIds, gameId],
      error: null 
    }));
    
    try {
      await addGameToCollection(gameId, status);
      await get().fetchCollection();

      set(state => ({ 
        loadingGameIds: state.loadingGameIds.filter(id => id !== gameId)
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
        loadingGameIds: state.loadingGameIds.filter(id => id !== gameId)
      }));
    } catch (error) {
      await get().fetchCollection();
      
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
        loadingGameIds: state.loadingGameIds.filter(id => id !== gameId)
      }));
    } catch (error) {
      await get().fetchCollection();
      
      set(state => ({ 
        error: error.message,
        loadingGameIds: state.loadingGameIds.filter(id => id !== gameId)
      }));
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
  },
  
  isGameLoading: (gameId) => {
    return get().loadingGameIds.includes(gameId);
  }
}));

export default useUserGameStore; 