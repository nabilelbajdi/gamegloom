import React, { useState, useRef } from 'react';
import { Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { updateUserProfile } from '../../api';
import useClickOutside from '../../hooks/useClickOutside';

const ProfileBio = ({ user, bio, onBioUpdate }) => {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState(bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isExpandedBio, setIsExpandedBio] = useState(false);

  const modalRef = useRef(null);
  const closeModal = () => {
    if (!isSaving) {
      setIsEditingBio(false);
    }
  };

  useClickOutside(modalRef, closeModal);

  const handleSaveBio = async () => {
    try {
      setIsSaving(true);
      setError('');
      await updateUserProfile({ bio: editedBio });
      onBioUpdate(editedBio);
      setIsEditingBio(false);
    } catch (err) {
      setError('Failed to update bio. Please try again.');
      console.error('Error updating bio:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-0 mb-10 md:ml-0">
      <div className="bg-[var(--bg-elevated-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-medium">Bio</h3>
            <button
              onClick={() => setIsEditingBio(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-surface-dark/20 transition-colors cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          </div>
          {bio ? (
            <div>
              <div
                className={`text-gray-300 text-sm leading-relaxed ${!isExpandedBio ? 'line-clamp-3' : ''}`}
              >
                {bio.split('\n').map((paragraph, index) => (
                  <p key={index} className={index > 0 ? 'mt-2' : ''}>
                    {paragraph}
                  </p>
                ))}
              </div>
              {bio.split('\n').length > 1 || bio.length > 180 ? (
                <button
                  onClick={() => setIsExpandedBio(!isExpandedBio)}
                  className="text-xs text-primary mt-1 hover:text-primary/90 transition-colors"
                >
                  {isExpandedBio ? 'Show Less' : 'Show More'}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="text-gray-500 italic text-sm">No bio available. Tell the community about yourself.</p>
          )}

          {/* Bio Edit Modal */}
          {isEditingBio && (
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <motion.div
                ref={modalRef}
                className="bg-surface-dark p-4 rounded-lg w-full max-w-md border border-gray-800/50 shadow-xl"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Edit className="w-5 h-5 text-primary" />
                    Edit Bio
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-300 cursor-pointer text-xl"
                  >
                    &times;
                  </button>
                </div>
                <div className="mb-4">
                  <div className="flex-1 flex items-center gap-3 py-2.5 px-2 bg-black/10 rounded transition-colors">
                    <textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
                      rows={4}
                      placeholder="Write something about yourself..."
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
                <div className="flex justify-end gap-5">
                  <button
                    onClick={() => {
                      setEditedBio(bio || '');
                      setIsEditingBio(false);
                      setError('');
                    }}
                    className="text-xs font-medium text-gray-400 hover:text-gray-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBio}
                    disabled={isSaving}
                    className={`text-xs font-semibold ${isSaving ? 'text-gray-500 cursor-not-allowed' : 'text-primary hover:text-primary/90 cursor-pointer'}`}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileBio; 