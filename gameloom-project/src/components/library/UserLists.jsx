import React, { useState } from 'react';
import { Plus, ListPlus, List, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import useUserListStore from '../../store/useUserListStore';
import ListCard from './ListCard';
import { createSlug } from '../../utils/stringUtils';

const UserLists = ({ onSelectList }) => {
  const { lists, createList, updateList, deleteList, isLoading } = useUserListStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeListId, setActiveListId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleCreateList = async () => {
    if (!name.trim()) return;
    
    const newList = await createList(name, description);
    if (newList) {
      setShowCreateModal(false);
      setName('');
      setDescription('');
    }
  };
  
  const handleUpdateList = async () => {
    if (!name.trim()) return;
    
    const updatedList = await updateList(activeListId, name, description);
    if (updatedList) {
      setShowEditModal(false);
      setName('');
      setDescription('');
      setActiveListId(null);
    }
  };
  
  const handleDeleteList = async () => {
    const success = await deleteList(activeListId);
    if (success) {
      setShowDeleteModal(false);
      setActiveListId(null);
    }
  };
  
  const openEditModal = (list) => {
    setActiveListId(list.id);
    setName(list.name);
    setDescription(list.description || '');
    setShowEditModal(true);
  };
  
  const openDeleteModal = (listId) => {
    setActiveListId(listId);
    setShowDeleteModal(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };
  
  const filteredLists = lists.filter(list => 
    list.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="w-full">
      {/* Lists Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-800/30">
        <motion.h3 
          className="text-2xl font-bold text-white mb-3 sm:mb-0"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          My Lists
        </motion.h3>
        <motion.button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 px-4 py-2 rounded-md bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-colors shadow-lg hover:shadow-white/5 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={16} />
          Create New List
        </motion.button>
      </div>
      
      {/* Search Bar */}
      {lists.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <div className="flex items-center gap-3 py-2.5 px-3 bg-black/10 rounded-md transition-colors">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lists..."
                className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-300 cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Lists Display */}
      {lists.length === 0 ? (
        <motion.div 
          className="text-center py-16 px-6 text-gray-400 bg-surface-dark/30 rounded-xl border border-gray-800/20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ListPlus className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h4 className="mb-3 font-bold text-xl text-gray-300">No lists yet</h4>
          <p className="text-sm mb-6 max-w-md mx-auto">Create your first game collection to organize your favorite titles in personalized lists</p>
          <motion.button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-white/10 text-white rounded-md text-sm font-semibold hover:bg-white/15 transition-colors shadow-md hover:shadow-white/5 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create Your First List
          </motion.button>
        </motion.div>
      ) : filteredLists.length === 0 ? (
        <motion.div 
          className="text-center py-10 px-6 text-gray-400 bg-surface-dark/30 rounded-xl border border-gray-800/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <h4 className="mb-2 font-bold text-lg text-gray-300">No matching lists found</h4>
          <p className="text-sm max-w-md mx-auto">
            No lists match your search for "{searchQuery}". Try using different keywords.
          </p>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredLists.map(list => (
            <motion.div key={list.id} variants={itemVariants}>
              <ListCard 
                list={list}
                onSelectList={onSelectList}
                onEditList={openEditModal}
                onDeleteList={openDeleteModal}
                loading={isLoading}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {/* Create Modal */}
      {showCreateModal && (
        <ListModal
          title="Create New List"
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          onSubmit={handleCreateList}
          onCancel={() => {
            setShowCreateModal(false);
            setName('');
            setDescription('');
          }}
          submitText="Create List"
        />
      )}
      
      {/* Edit Modal */}
      {showEditModal && (
        <ListModal
          title="Edit List"
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          onSubmit={handleUpdateList}
          onCancel={() => {
            setShowEditModal(false);
            setName('');
            setDescription('');
            setActiveListId(null);
          }}
          submitText="Save Changes"
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          onConfirm={handleDeleteList}
          onCancel={() => {
            setShowDeleteModal(false);
            setActiveListId(null);
          }}
        />
      )}
    </div>
  );
};

// Modal for creating and editing lists
const ListModal = ({ title, name, setName, description, setDescription, onSubmit, onCancel, submitText }) => {
  return (
    <motion.div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div 
        className="bg-surface-dark p-4 rounded-lg max-w-md w-full border border-gray-800/50 shadow-xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <List className="w-5 h-5 text-primary" />
            {title}
          </h3>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-300 cursor-pointer text-xl"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 py-2.5 px-2 bg-black/10 rounded transition-colors">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter list name..."
                className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-500 focus:outline-none"
                autoFocus
              />
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 py-2.5 px-2 bg-black/10 rounded transition-colors">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter list description (optional)..."
                className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
                rows="2"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-5">
          <button
            onClick={onCancel}
            className="text-xs font-medium text-gray-400 hover:text-gray-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!name.trim()}
            className={`text-xs font-semibold ${!name.trim() ? 'text-gray-500 cursor-not-allowed' : 'text-primary hover:text-primary/90 cursor-pointer'}`}
          >
            {submitText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Delete confirmation modal
const DeleteConfirmModal = ({ onConfirm, onCancel }) => {
  return (
    <motion.div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div 
        className="bg-surface-dark p-4 rounded-lg max-w-sm w-full border border-gray-800/50 shadow-xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-[var(--color-want)]" />
            Delete List
          </h3>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-300 cursor-pointer text-xl"
          >
            &times;
          </button>
        </div>
        
        <p className="text-sm text-gray-300 mb-4">
          Are you sure you want to delete this list? This action cannot be undone.
        </p>
        
        <div className="flex justify-end gap-5">
          <button
            onClick={onCancel}
            className="text-xs font-medium text-gray-400 hover:text-gray-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-xs font-semibold text-[var(--color-want)] hover:text-[var(--color-want)]/90 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserLists; 