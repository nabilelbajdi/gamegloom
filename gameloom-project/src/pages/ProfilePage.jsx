import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserStats, fetchUserActivities } from '../api';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileBio from '../components/profile/ProfileBio';
import ActivityFeed from '../components/profile/ActivityFeed';
import GameProgress from '../components/profile/GameProgress';
import { Heart } from 'lucide-react';

const ProfilePage = () => {
  const { user, checkAuth } = useAuth();
  const [stats, setStats] = useState({
    total_games: 0,
    want_to_play_count: 0,
    playing_count: 0,
    played_count: 0,
    reviews_count: 0,
    average_rating: null,
    lists_count: 0
  });
  const [activities, setActivities] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [displayedActivities, setDisplayedActivities] = useState(4);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const [userStats, activitiesData] = await Promise.all([
            fetchUserStats(),
            fetchUserActivities(15)
          ]);
          
          setStats(userStats);
          setActivities(activitiesData.activities || []);
        } catch (err) {
          console.error('Error fetching user data:', err);
        } finally {
          setIsLoadingStats(false);
          setIsLoadingActivities(false);
        }
      }
    };

    loadData();
  }, [user]);

  const handleLoadMoreActivities = async () => {
    if (displayedActivities < activities.length) {
      setDisplayedActivities(prev => prev + 4);
    } else {
      try {
        setIsLoadingMore(true);
        const result = await fetchUserActivities(15, activities.length);
        if (result.activities && result.activities.length > 0) {
          setActivities(prev => [...prev, ...result.activities]);
          setDisplayedActivities(prev => prev + 4);
        }
      } catch (err) {
        console.error('Error loading more activities:', err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  if (!user) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-500">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-14">
      <ProfileHeader 
        user={user} 
        stats={stats} 
        isLoadingStats={isLoadingStats} 
        onProfileUpdate={(updatedUser) => checkAuth()}
      />
      
      {/* Content Container */}
      <div className="container max-w-7xl mx-auto px-4 md:px-6 relative">
        {/* Two-column layout*/}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column: Profile Bio and Activity Feed */}
          <div className="lg:col-span-2 space-y-8">
            <ProfileBio 
              user={user} 
              bio={user.bio} 
              onBioUpdate={(newBio) => checkAuth()} 
            />
            <ActivityFeed 
              activities={activities}
              displayedActivities={displayedActivities}
              isLoadingActivities={isLoadingActivities}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMoreActivities}
              user={user}
            />
          </div>
          
          {/* Right Column: Game Stats */}
          <div className="lg:col-span-1 space-y-8">
            {/* Recommended For You */}
            <div className="bg-surface-dark/30 rounded-xl border border-gray-800/20 overflow-hidden shadow-md">
              <div className="px-6 py-5 border-b border-gray-800/30">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  Recommended For You
                </h2>
              </div>
              
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <Heart className="h-12 w-12 text-gray-600 mb-4 fill-gray-600" />
                <h3 className="text-gray-300 font-medium mb-2">Game Recommendations</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Personalized game recommendations based on your gaming activity will appear here soon.
                </p>
              </div>
            </div>
            
            <GameProgress stats={stats} isLoadingStats={isLoadingStats} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 