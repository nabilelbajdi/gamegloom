import React, { useState } from 'react';
import { Plus, Check, List, ArrowRight, ChevronRight, ListCheck, ListPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useUserListStore from '../../store/useUserListStore';
import { createSlug } from '../../utils/stringUtils';
import useClickOutside from '../../hooks/useClickOutside';

const ListSelectionModal = ({ 
  isOpen, 
  onClose, 
  game, 
  lists = []
}) => {
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [listActionLoading, setListActionLoading] = useState(false);
  
  const modalRef = useClickOutside(onClose);
  
  const { addGame, removeGame, createList } = useUserListStore();
  
  const handleToggleGameInList = async (listId) => {
    if (listActionLoading) return;
    
    setListActionLoading(true);
    
    try {
      const list = lists.find(l => l.id === listId);
      if (!list) return;
      
      const gameInList = list.games?.some(g => g.id === game.id);
      
      if (gameInList) {
        await removeGame(listId, game.id);
      } else {
        await addGame(listId, game.id);
      }
    } catch (error) {
      console.error("Error updating list:", error);
    } finally {
      setListActionLoading(false);
    }
  };
  
  const handleCreateList = async () => {
    if (!newListName.trim() || listActionLoading) return;
    
    setListActionLoading(true);
    
    try {
      const newList = await createList(newListName, '');
      if (newList) {
        await addGame(newList.id, game.id);
        setNewListName('');
        setIsCreatingList(false);
      }
    } catch (error) {
      console.error("Error creating list:", error);
    } finally {
      setListActionLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div 
        ref={modalRef}
        className="bg-surface-dark rounded-lg max-w-md w-full p-4 shadow-xl border border-gray-800/50"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
        
        {/* Create New List Section */}
        {isCreatingList ? (
          <div className="mb-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 py-2.5 px-2 bg-black/10 rounded transition-colors">
                <input 
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter list name..."
                  className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-500 focus:outline-none"
                  autoFocus
                />
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => setIsCreatingList(false)}
                    className="text-xs font-medium text-gray-400 hover:text-gray-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateList}
                    disabled={!newListName.trim() || listActionLoading}
                    className={`text-xs font-semibold ${(!newListName.trim() || listActionLoading) ? 'text-gray-500 cursor-not-allowed' : 'text-primary hover:text-primary/90 cursor-pointer'}`}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingList(true)}
            className="w-full py-2.5 px-3 rounded-md text-sm font-semibold flex items-center justify-start gap-3 bg-surface-dark text-primary hover:bg-surface-dark/90 transition-colors mb-3 cursor-pointer"
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            Add to New List
          </button>
        )}
        
        {/* Lists Section */}
        <div className="max-h-[45vh] overflow-y-auto scrollbar-hide pr-2">
          {lists.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              <List className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">You don't have any lists yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/30">
              {lists.map(list => {
                const isInList = list.games?.some(g => g.id === game.id);
                const listSlug = createSlug(list.name);
                return (
                  <div 
                    key={list.id}
                    className="flex items-center py-1"
                  >
                    <button
                      onClick={() => handleToggleGameInList(list.id)}
                      disabled={listActionLoading}
                      className="flex-1 flex items-center gap-3 cursor-pointer py-2.5 px-2 hover:bg-black/10 rounded transition-colors w-full"
                    >
                      <div className={`flex-shrink-0 transition-colors ${isInList ? 'text-completed' : 'text-gray-400'}`}>
                        {isInList ? (
                          <ListCheck className="w-5 h-5" />
                        ) : (
                          <ListPlus className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-200 truncate max-w-[220px]" title={list.name}>{list.name}</span>
                    </button>
                    <Link 
                      to={`/library?tab=my_lists&list=${listSlug}`}
                      className="ml-2 p-2 text-gray-400 hover:text-gray-300 rounded-full hover:bg-black/10"
                      title="Go to list"
                      onClick={onClose}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
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
      </motion.div>
    </motion.div>
  );
};

export default ListSelectionModal; 