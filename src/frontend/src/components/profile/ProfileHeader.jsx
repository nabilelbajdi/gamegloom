import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Gamepad2, Star, BarChart3, Camera, Loader2 } from 'lucide-react';
import AvatarUpload from './AvatarUpload';

const ProfileHeader = ({ user, stats, isLoadingStats, onProfileUpdate }) => {
  const [isAvatarUploadOpen, setIsAvatarUploadOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '/images/default-avatar.svg');
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const joinDate = user.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : 'Unknown';

  useEffect(() => {
    if (user?.avatar) {
      setAvatarUrl(user.avatar);
    }
  }, [user?.avatar]);

  const handleAvatarUpdate = (newAvatarUrl) => {
    setIsAvatarLoading(true);
    const cacheBustUrl = `${newAvatarUrl}?t=${new Date().getTime()}`;
    setAvatarUrl(cacheBustUrl);

    if (onProfileUpdate) {
      onProfileUpdate({ ...user, avatar: newAvatarUrl });
    }
  };

  const handleImageLoad = () => {
    setIsAvatarLoading(false);
  };

  const handleImageError = () => {
    setIsAvatarLoading(false);
    setAvatarUrl('/images/default-avatar.svg');
  };

  return (
    <>
      {/* Profile Header*/}
      <div className="w-full mb-8 relative z-10 pt-8 pb-4 border-b border-[var(--border-subtle)]">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-8 py-6 pt-0 md:py-8 md:pt-0">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border-4 border-surface-dark shadow-xl overflow-hidden bg-gray-700 group">
                {isAvatarLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800/70 z-10">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                )}
                <img
                  src={avatarUrl}
                  alt={user.username}
                  className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />

                {/* Change avatar button */}
                <button
                  onClick={() => setIsAvatarUploadOpen(true)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer rounded-full"
                  disabled={isAvatarLoading}
                  aria-label="Change avatar"
                >
                  <div className="flex flex-col items-center justify-center text-white gap-1">
                    <Camera className="h-6 w-6" />
                    <span className="text-xs font-medium">Change</span>
                  </div>
                </button>
              </div>
              <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-green-500 border-2 border-surface-dark"></div>
            </div>

            {/* User Info */}
            <div className="flex-1 pt-2 md:pb-2">
              <div className="space-y-3">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">{user.username}</h1>
                  <div className="flex items-center text-sm text-gray-300 mt-1.5">
                    <span className="tracking-wide">Member since {joinDate}</span>
                  </div>
                </div>

                {/* Quick Stats */}
                {!isLoadingStats && (
                  <div className="flex flex-nowrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-primary font-semibold leading-tight text-sm">{stats.total_games}</span>
                        <span className="text-gray-400 text-xs">Games</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-primary font-semibold leading-tight text-sm">{stats.reviews_count}</span>
                        <span className="text-gray-400 text-xs">Reviews</span>
                      </div>
                    </div>

                    {stats.average_rating !== null && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="p-1.5 rounded-full bg-primary/10">
                          <BarChart3 className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-primary font-semibold leading-tight text-sm">{stats.average_rating}</span>
                          <span className="text-gray-400 text-xs">Rating</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Upload Modal */}
      {isAvatarUploadOpen && (
        <AvatarUpload
          currentAvatar={user.avatar}
          onAvatarUpdate={handleAvatarUpdate}
          onClose={() => setIsAvatarUploadOpen(false)}
        />
      )}
    </>
  );
};

export default ProfileHeader; 