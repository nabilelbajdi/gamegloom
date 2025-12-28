import { create } from 'zustand'
import { getUserLists, getUserList, createUserList, updateUserList, deleteUserList, addGameToList, removeGameFromList } from '../api'

const useUserListStore = create((set, get) => ({
  lists: [],
  listDetails: {}, // Cache for individual list details (lazy loaded)
  listsLoading: false,
  listDetailLoading: false,
  error: null,
  lastFetched: null, // Cache timestamp

  // Fetch lists - just the list metadata, not games (fast)
  fetchLists: async (forceRefresh = false) => {
    const { lastFetched, listsLoading } = get();

    // Skip if already loading
    if (listsLoading) return;

    // Skip if cached within 5 minutes (unless forced)
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    if (!forceRefresh && lastFetched && (Date.now() - lastFetched) < CACHE_DURATION) {
      return;
    }

    set({ listsLoading: true, error: null });
    try {
      const response = await getUserLists();
      // Store lists directly without fetching each one's games
      set({
        lists: response.lists || [],
        listsLoading: false,
        lastFetched: Date.now()
      });
    } catch (error) {
      set({ error: error.message, listsLoading: false });
    }
  },

  // Lazy load specific list details (with games) when user opens it
  fetchListDetails: async (listId, forceRefresh = false) => {
    const { listDetails, listDetailLoading } = get();

    // Return cached if available and not forcing refresh
    if (!forceRefresh && listDetails[listId]) {
      return listDetails[listId];
    }

    if (listDetailLoading) return null;

    set({ listDetailLoading: true, error: null });
    try {
      const list = await getUserList(listId);
      set(state => ({
        listDetails: { ...state.listDetails, [listId]: list },
        // Also update the list in the lists array with game count
        lists: state.lists.map(l => l.id === listId ? { ...l, games: list.games, game_count: list.games?.length || 0 } : l),
        listDetailLoading: false
      }));
      return list;
    } catch (error) {
      set({ error: error.message, listDetailLoading: false });
      return null;
    }
  },

  // Get cached list details (sync, for rendering)
  getCachedListDetails: (listId) => {
    return get().listDetails[listId] || null;
  },

  getList: async (listId) => {
    return get().fetchListDetails(listId);
  },

  createList: async (name, description, isPublic = false) => {
    set({ listsLoading: true, error: null });
    try {
      const newList = await createUserList(name, description, isPublic);
      set((state) => ({
        lists: [...state.lists, newList],
        listsLoading: false,
        lastFetched: Date.now()
      }));
      return newList;
    } catch (error) {
      set({ error: error.message, listsLoading: false });
      return null;
    }
  },

  updateList: async (listId, name, description, isPublic = null) => {
    set({ listsLoading: true, error: null });
    try {
      const updatedList = await updateUserList(listId, name, description, isPublic);
      set((state) => ({
        lists: state.lists.map(list =>
          list.id === listId ? { ...list, ...updatedList } : list
        ),
        listDetails: { ...state.listDetails, [listId]: updatedList },
        listsLoading: false
      }));
      return updatedList;
    } catch (error) {
      set({ error: error.message, listsLoading: false });
      return null;
    }
  },

  deleteList: async (listId) => {
    set({ listsLoading: true, error: null });
    try {
      await deleteUserList(listId);
      set((state) => {
        const { [listId]: removed, ...remainingDetails } = state.listDetails;
        return {
          lists: state.lists.filter(list => list.id !== listId),
          listDetails: remainingDetails,
          listsLoading: false
        };
      });
      return true;
    } catch (error) {
      set({ error: error.message, listsLoading: false });
      return false;
    }
  },

  addGame: async (listId, gameId) => {
    set({ listsLoading: true, error: null });
    try {
      const updatedList = await addGameToList(listId, gameId);
      set((state) => ({
        lists: state.lists.map(list =>
          list.id === listId ? { ...list, games: updatedList.games, game_count: updatedList.games?.length || 0 } : list
        ),
        listDetails: { ...state.listDetails, [listId]: updatedList },
        listsLoading: false
      }));
      return updatedList;
    } catch (error) {
      set({ error: error.message, listsLoading: false });
      return null;
    }
  },

  removeGame: async (listId, gameId) => {
    set({ listsLoading: true, error: null });
    try {
      const updatedList = await removeGameFromList(listId, gameId);
      set((state) => ({
        lists: state.lists.map(list =>
          list.id === listId ? { ...list, games: updatedList.games, game_count: updatedList.games?.length || 0 } : list
        ),
        listDetails: { ...state.listDetails, [listId]: updatedList },
        listsLoading: false
      }));
      return updatedList;
    } catch (error) {
      set({ error: error.message, listsLoading: false });
      return null;
    }
  },

  setSelectedList: (listId) => {
    set({ selectedList: listId });
  },

  // Clear all on logout
  clearLists: () => {
    set({
      lists: [],
      listDetails: {},
      listsLoading: false,
      listDetailLoading: false,
      error: null,
      lastFetched: null
    });
  }
}));

export default useUserListStore;