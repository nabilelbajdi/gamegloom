import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, PlayCircle, CheckCircle, ChevronRight } from 'lucide-react';

const GameProgress = ({ stats, isLoadingStats }) => {
  return (
    <div className="bg-[var(--bg-elevated-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-md">
      <div className="px-6 py-4 border-b border-gray-800/30">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <ChevronRight className="h-4 w-4 mr-2 text-primary" />
          <Link to="/library" className="hover:text-primary transition-colors">Game Progress</Link>
        </h2>
      </div>

      {!isLoadingStats ? (
        <div className="divide-y divide-gray-800/30">
          <Link
            to="/library?tab=want_to_play"
            className="flex items-center justify-between px-6 py-3 hover:bg-surface-dark/20 transition-colors"
          >
            <div className="flex items-center">
              <Heart className="w-4 h-4 text-want mr-3 fill-want" />
              <span className="text-gray-300 text-sm">Want to Play</span>
            </div>
            <span className="text-want font-semibold">{stats.want_to_play_count}</span>
          </Link>
          <Link
            to="/library?tab=playing"
            className="flex items-center justify-between px-6 py-3 hover:bg-surface-dark/20 transition-colors"
          >
            <div className="flex items-center">
              <PlayCircle className="w-4 h-4 text-secondary mr-3" />
              <span className="text-gray-300 text-sm">Currently Playing</span>
            </div>
            <span className="text-secondary font-semibold">{stats.playing_count}</span>
          </Link>
          <Link
            to="/library?tab=played"
            className="flex items-center justify-between px-6 py-3 hover:bg-surface-dark/20 transition-colors"
          >
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-completed mr-3" />
              <span className="text-gray-300 text-sm">Completed</span>
            </div>
            <span className="text-completed font-semibold">{stats.played_count}</span>
          </Link>
        </div>
      ) : (
        <div className="p-5 space-y-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-5 rounded bg-surface-dark/50 animate-pulse"></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameProgress; 