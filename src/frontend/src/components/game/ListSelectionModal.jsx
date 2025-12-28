import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Check, List, ArrowRight, ChevronRight, ListCheck, ListPlus, Search, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useUserListStore from '../../store/useUserListStore';
import { createSlug } from '../../utils/stringUtils';
import useClickOutside from '../../hooks/useClickOutside';

const ListSelectionModal = ({
  isOpen,
  onClose,
  game
}) => {
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListIsPublic, setNewListIsPublic] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [listActionLoading, setListActionLoading] = useState(null); // Stores list ID being updated
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyToggled, setRecentlyToggled] = useState(null);
  const [toast, setToast] = useState(null);

  const modalRef = useClickOutside(onClose);

  // Get lists from store directly so it updates reactively
  const { lists, addGame, removeGame, createList, fetchLists } = useUserListStore();

  // Fetch lists when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLists();
    }
  }, [isOpen, fetchLists]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Clear animation highlight after delay
  useEffect(() => {
    if (recentlyToggled) {
      const timer = setTimeout(() => setRecentlyToggled(null), 600);
      return () => clearTimeout(timer);
    }
  }, [recentlyToggled]);

  const handleToggleGameInList = async (listId) => {
    if (listActionLoading) return;

    setListActionLoading(listId); // Track which list is loading
    setRecentlyToggled(listId);

    try {
      const list = lists.find(l => l.id === listId);
      if (!list) return;

      const gameInList = list.games?.some(g => g.id === game.id);

      if (gameInList) {
        await removeGame(listId, game.id);
        setToast({ type: 'removed', listName: list.name });
      } else {
        await addGame(listId, game.id);
        setToast({ type: 'added', listName: list.name });
      }
    } catch (error) {
      console.error("Error updating list:", error);
      setToast({ type: 'error', listName: 'Error updating list' });
    } finally {
      setListActionLoading(null);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim() || listActionLoading) return;

    setListActionLoading('creating');

    try {
      const newList = await createList(newListName, newListDescription, newListIsPublic);
      if (newList) {
        await addGame(newList.id, game.id);
        setNewListName('');
        setNewListDescription('');
        setNewListIsPublic(false);
        setIsCreatingList(false);
        setToast({ type: 'added', listName: newList.name });
      }
    } catch (error) {
      console.error("Error creating list:", error);
      setToast({ type: 'error', listName: 'Error creating list' });
    } finally {
      setListActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <motion.div
        ref={modalRef}
        className="bg-surface-dark rounded-lg max-w-md w-full mx-4 p-4 shadow-xl border border-gray-800/50 max-h-[85vh] flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <List className="w-5 h-5 text-primary" />
            Add to Lists
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 cursor-pointer text-xl"
          >
            &times;
          </button>
        </div>

        {/* Game Info */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800/30">
          <img
            src={game.coverImage || game.cover_image}
            alt={game.name}
            className="w-12 h-16 object-cover rounded"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white truncate">{game.name}</p>
            <p className="text-xs text-gray-500">Select lists to add this game</p>
          </div>
        </div>

        {/* Create New List Section */}
        {isCreatingList ? (
          <div className="mb-4 p-3 bg-black/10 rounded-lg border border-gray-800/30">
            {/* List Name */}
            <div className="mb-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                className="w-full bg-transparent border-b border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 pb-2"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="mb-3">
              <textarea
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="Description (optional)..."
                className="w-full bg-transparent border-b border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 pb-2 resize-none"
                rows="2"
              />
            </div>

            {/* Make Public Toggle */}
            <div className="mb-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={newListIsPublic}
                    onChange={(e) => setNewListIsPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-primary/60 transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-gray-300 rounded-full transition-transform peer-checked:translate-x-4 peer-checked:bg-white"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-white group-hover:text-primary transition-colors">Make Public</span>
                  <span className="text-[10px] text-gray-500">Others can discover this list</span>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setIsCreatingList(false);
                  setNewListName('');
                  setNewListDescription('');
                  setNewListIsPublic(false);
                }}
                className="text-xs font-medium text-gray-400 hover:text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim() || listActionLoading}
                className={`text-xs font-semibold flex items-center gap-1 ${(!newListName.trim() || listActionLoading) ? 'text-gray-500 cursor-not-allowed' : 'text-primary hover:text-primary/90 cursor-pointer'}`}
              >
                {listActionLoading === 'creating' && <Loader2 className="w-3 h-3 animate-spin" />}
                Create & Add
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingList(true)}
            className="w-full py-2.5 px-3 rounded-md text-sm font-semibold flex items-center justify-start gap-3 bg-surface-dark text-primary hover:bg-surface-dark/90 transition-colors mb-3 cursor-pointer"
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            Create New List
          </button>
        )}

        {/* Search Input - Only show if more than 5 lists */}
        {lists.length > 5 && (
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lists..."
                className="w-full pl-10 pr-4 py-2 bg-black/10 border border-gray-700/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        )}

        {/* Lists Section */}
        <div className="flex-1 min-h-0 max-h-[35vh] overflow-y-auto scrollbar-hide pr-2">
          {lists.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              <List className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">You don't have any lists yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/30">
              {lists
                .filter(list => list.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(list => {
                  const isInList = list.games?.some(g => g.id === game.id);
                  const listSlug = createSlug(list.name);
                  const isEmpty = !list.games || list.games.length === 0;
                  const isAnimating = recentlyToggled === list.id;
                  const isLoading = listActionLoading === list.id;
                  return (
                    <motion.div
                      key={list.id}
                      className="flex items-center py-1"
                      animate={isAnimating ? { scale: [1, 1.01, 1] } : {}}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={() => handleToggleGameInList(list.id)}
                        disabled={listActionLoading !== null}
                        className={`flex-1 flex items-center gap-3 cursor-pointer py-2.5 px-2 hover:bg-white/5 rounded transition-all w-full ${isLoading ? 'opacity-70' : ''}`}
                      >
                        <div className={`flex-shrink-0 transition-all duration-300 ${isLoading ? 'text-gray-400' : isInList ? 'text-green-500' : 'text-gray-400'}`}>
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : isInList ? (
                            <ListCheck className="w-5 h-5" />
                          ) : (
                            <ListPlus className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-semibold truncate block ${isInList ? 'text-white' : 'text-gray-200'}`} title={list.name}>{list.name}</span>
                          <span className={`text-xs ${isEmpty ? 'text-gray-600 italic' : 'text-gray-500'}`}>
                            {isEmpty ? 'Empty list' : `${list.games.length} game${list.games.length !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </button>
                      <Link
                        to={`/library?tab=my_lists&list=${listSlug}`}
                        className="ml-2 p-2 text-gray-400 hover:text-gray-300 rounded-full hover:bg-black/10"
                        title="Go to list"
                        onClick={onClose}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-gray-800/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded hover:bg-black/10 cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg ${toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-gray-800 text-white'
                }`}
            >
              {toast.type !== 'error' && <CheckCircle className="w-4 h-4 text-green-400" />}
              {toast.type === 'added' && `Added to "${toast.listName}"`}
              {toast.type === 'removed' && `Removed from "${toast.listName}"`}
              {toast.type === 'error' && toast.listName}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default ListSelectionModal;