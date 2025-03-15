import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { 
  Star, 
  MessageCircleMore, 
  PlayCircle, 
  CheckCircle, 
  Heart, 
  Clock, 
  Timer,
  AlertCircle
} from 'lucide-react';
import ActivityFeedGameCover from '../game/ActivityFeedGameCover';
import TruncatedText from '../common/TruncatedText';

const ActivityFeed = ({ activities, displayedActivities, isLoadingActivities, isLoadingMore, onLoadMore, user }) => {
  const getActivityText = (activity) => {
    const gameName = activity.game?.name || 'a game';
    const username = user.username;
    
    switch (activity.activity_type) {
      case 'game_status_updated':
        const statusMessages = {
          want_to_play: (
            <>
              <div className="flex items-center min-w-0">
                <Heart className="h-4 w-4 text-[var(--color-want)] mr-2 flex-shrink-0 fill-[var(--color-want)]" />
                <TruncatedText>
                  {username} wants to play <Link to={`/game/${activity.game?.igdb_id}`} className="text-primary hover:underline">{gameName}</Link>
                </TruncatedText>
              </div>
              <TruncatedText className="block mt-1 text-sm text-gray-400 italic">
                Added to play later list
              </TruncatedText>
            </>
          ),
          playing: (
            <>
              <div className="flex items-center min-w-0">
                <PlayCircle className="h-4 w-4 text-secondary mr-2 flex-shrink-0" />
                <TruncatedText>
                  {username} is playing <Link to={`/game/${activity.game?.igdb_id}`} className="text-primary hover:underline">{gameName}</Link>
                </TruncatedText>
              </div>
              <TruncatedText className="block mt-1 text-sm text-gray-400 italic">
                Currently in progress
              </TruncatedText>
            </>
          ),
          played: (
            <>
              <div className="flex items-center min-w-0">
                <CheckCircle className="h-4 w-4 text-[var(--color-completed)] mr-2 flex-shrink-0" />
                <TruncatedText>
                  {username} completed <Link to={`/game/${activity.game?.igdb_id}`} className="text-primary hover:underline">{gameName}</Link>
                </TruncatedText>
              </div>
              <TruncatedText className="block mt-1 text-sm text-gray-400 italic">
                Game completed!
              </TruncatedText>
            </>
          )
        };

        return statusMessages[activity.game_status] || (
          <>
            <div className="flex items-center min-w-0">
              <TruncatedText>
                Added <Link to={`/game/${activity.game?.igdb_id}`} className="text-primary hover:underline">{gameName}</Link> to collection
              </TruncatedText>
            </div>
            <TruncatedText className="block mt-1 text-sm text-gray-400 italic">
              Added to game collection
            </TruncatedText>
          </>
        );
        
      case 'review_created':
        return (
          <>
            <div className="flex items-center min-w-0">
              <span className="inline-flex items-center mr-2 flex-shrink-0">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-primary font-medium ml-0.5">{activity.review?.rating || 0}</span>
              </span>
              <TruncatedText>
                {username} {activity.review_content ? 'reviewed' : 'rated'} <Link to={`/game/${activity.game?.igdb_id}`} className="text-primary hover:underline">{gameName}</Link>
              </TruncatedText>
            </div>
            <TruncatedText className="mt-1 text-sm text-gray-400 italic">
              {activity.review_content ? activity.review_content : `Rated ${activity.review?.rating || 0} out of 5 stars`}
            </TruncatedText>
          </>
        );
        
      case 'review_commented':
        return (
          <>
            <div className="flex items-center min-w-0">
              <MessageCircleMore className="h-4 w-4 text-gray-300 mr-2 flex-shrink-0" />
              <TruncatedText>
                {username} commented on {activity.target_username}'s review of <Link to={`/game/${activity.game?.igdb_id}`} className="text-primary hover:underline">{gameName}</Link>
              </TruncatedText>
            </div>
            <TruncatedText className="mt-1 text-sm text-gray-400 italic">
              {activity.comment_content || 'Added a comment'}
            </TruncatedText>
          </>
        );
        
      default:
        return <span>Activity with {gameName}</span>;
    }
  };

  return (
    <div className="mb-8 lg:mb-0 mt-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-primary/10">
            <Timer className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
        </div>
      </div>
      
      {isLoadingActivities ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start animate-pulse">
              <div className="w-16 md:w-20 h-24 bg-surface-dark/50 rounded-lg mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-surface-dark/50 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-surface-dark/50 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-surface-dark/50 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="py-12 text-center bg-surface-dark/20 rounded-xl border border-gray-800/30">
          <AlertCircle className="h-10 w-10 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No recent activity to show.</p>
          <p className="text-gray-500 text-sm mt-1">Your gaming activities will appear here.</p>
        </div>
      ) : (
        <div>
          <div className="space-y-6">
            {activities.slice(0, displayedActivities).map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start pb-6 last:pb-0 relative hover:bg-surface-dark/10 transition-colors -mx-4 px-4 pt-2 pb-6 rounded-lg"
              >
                {/* Game Cover */}
                <div className="relative z-10">
                  {activity.game && (
                    <ActivityFeedGameCover game={activity.game} className="flex-shrink-0" />
                  )}
                </div>
                
                {/* Activity Content */}
                <div className="flex-1 min-w-0 pl-4">
                  <div className="text-gray-200 min-w-0">
                    {getActivityText(activity)}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistance(new Date(activity.timestamp), new Date(), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More Button */}
          {displayedActivities < activities.length || isLoadingMore ? (
            <div className="mt-6 flex justify-center">
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isLoadingMore ? (
                  <div className="w-3 h-3 border border-gray-500 border-t-gray-300 rounded-full animate-spin"></div>
                ) : null}
                {isLoadingMore ? "Loading..." : "Show more activities"}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed; 