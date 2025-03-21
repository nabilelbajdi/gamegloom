import { create } from 'zustand'
import { getUserLists, getUserList, createUserList, updateUserList, deleteUserList, addGameToList, removeGameFromList } from '../api'

const useUserListStore = create((set, get) => ({
  lists: [],
  selectedList: null,
  isLoading: false,
  error: null,
  
  fetchLists: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getUserLists();
      
      // Fetch each list individually to get the games
      const listsWithGames = [];
      
      for (const list of response.lists || []) {
        try {
          const detailedList = await getUserList(list.id);
          listsWithGames.push(detailedList);
        } catch (error) {
          console.error(`Error fetching details for list ${list.id}:`, error);
          // Still add the list without games rather than skipping it
          listsWithGames.push(list);
        }
      }
      
      set({ lists: listsWithGames || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  getList: async (listId) => {
    set({ isLoading: true, error: null });
    try {
      const list = await getUserList(listId);
      return list;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  createList: async (name, description) => {
    set({ isLoading: true, error: null });
    try {
      const newList = await createUserList(name, description);
      set((state) => ({ 
        lists: [...state.lists, newList],
        isLoading: false
      }));
      return newList;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  updateList: async (listId, name, description) => {
    set({ isLoading: true, error: null });
    try {
      const updatedList = await updateUserList(listId, name, description);
      set((state) => ({
        lists: state.lists.map(list => 
          list.id === listId ? updatedList : list
        ),
        isLoading: false
      }));
      return updatedList;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  deleteList: async (listId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteUserList(listId);
      set((state) => ({
        lists: state.lists.filter(list => list.id !== listId),
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },
  
  addGame: async (listId, gameId) => {
    set({ isLoading: true, error: null });
    try {
      const updatedList = await addGameToList(listId, gameId);
      set((state) => ({
        lists: state.lists.map(list => 
          list.id === listId ? updatedList : list
        ),
        isLoading: false
      }));
      return updatedList;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  removeGame: async (listId, gameId) => {
    set({ isLoading: true, error: null });
    try {
      const updatedList = await removeGameFromList(listId, gameId);
      set((state) => ({
        lists: state.lists.map(list => 
          list.id === listId ? updatedList : list
        ),
        isLoading: false
      }));
      return updatedList;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  setSelectedList: (listId) => {
    set({ selectedList: listId });
  }
}));

export default useUserListStore; 