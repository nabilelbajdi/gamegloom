// src/components/GamePage/GameMedia.jsx
import React from "react";

const GameMedia = React.memo(({ screenshots, videos }) => {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Media</h2>
      
      {/* Videos Section */}
      {videos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">Videos</h3>
          <div className="flex gap-4 overflow-x-auto">
            {videos.map((video, index) => (
              <iframe
                key={index}
                width="320"
                height="180"
                src={video}
                title={`Video ${index + 1}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg shadow-md"
              ></iframe>
            ))}
          </div>
        </div>
      )}

      {/* Screenshots Section */}
      {screenshots.length > 0 && (
        <div>
          <h3 className="text-md font-semibold mb-2">Screenshots</h3>
          <div className="flex gap-4 overflow-x-auto">
            {screenshots.map((screenshot, index) => (
              <img
                key={index}
                src={screenshot}
                alt={`Screenshot ${index + 1}`}
                className="w-64 h-36 object-cover rounded-lg shadow-md"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default GameMedia;
