import React, { useState } from 'react';
import { Edit, X } from 'lucide-react';
import { updateUserProfile } from '../../api';

const ProfileBio = ({ user, bio, onBioUpdate }) => {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState(bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isExpandedBio, setIsExpandedBio] = useState(false);

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
      <div className="bg-surface-dark/30 rounded-xl border border-gray-800/20 overflow-hidden">
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
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
              <div className="bg-surface-dark rounded-lg w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4">
                  <h3 className="text-base font-medium text-white">Edit Bio</h3>
                  <button 
                    onClick={() => setIsEditingBio(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-4 pb-4">
                  <textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    className="w-full p-3 bg-surface-darker text-white border border-gray-700/30 rounded focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
                    rows={4}
                    placeholder="Write something about yourself..."
                  />
                  {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
                <div className="p-4 flex justify-end gap-2 bg-surface-darker/50 rounded-b-lg">
                  <button
                    onClick={() => {
                      setEditedBio(bio || '');
                      setIsEditingBio(false);
                      setError('');
                    }}
                    className="px-3 py-1.5 bg-gray-700/30 hover:bg-gray-700/50 rounded text-gray-300 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBio}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-primary hover:bg-primary/90 rounded text-dark text-sm font-medium transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileBio; 