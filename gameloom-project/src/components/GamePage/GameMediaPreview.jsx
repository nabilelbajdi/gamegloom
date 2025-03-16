// src/components/GamePage/GameMediaPreview.jsx
import React, { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import ImageGallery from "../common/ImageGallery";

const GameMediaPreview = ({ screenshots = [], trailer }) => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  // Function to open the gallery
  const openGallery = (initialIndex = 0) => {
    setGalleryInitialIndex(initialIndex);
    setGalleryOpen(true);
  };
  
  // Only show the grid layout if we have both trailer and screenshots or just screenshots
  const hasOnlyTrailer = trailer && (!screenshots || screenshots.length === 0);
  
  return (
    <div className="mt-6">
      {/* Only Trailer */}
      {hasOnlyTrailer && (
        <div className="w-full">
          <iframe
            width="100%"
            height="400"
            src={trailer}
            title="Game Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg shadow-md"
          ></iframe>
        </div>
      )}
      
      {/* Media Grid for trailer + screenshots or just screenshots */}
      {!hasOnlyTrailer && (
        <div className={`grid ${trailer ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-2'} gap-4`}>
          {/* Trailer Grid Item */}
          {trailer && (
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={trailer}
                title="Game Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg shadow-md h-full"
              ></iframe>
            </div>
          )}
          
          {/* Screenshots Grid */}
          {screenshots?.length > 0 && (
            <div className={`grid grid-cols-2 gap-2 ${trailer ? '' : 'col-span-2'}`}>
              {screenshots.slice(0, 3).map((screenshot, index) => (
                <img 
                  key={index} 
                  src={screenshot} 
                  alt={`Screenshot ${index + 1}`} 
                  className="w-full aspect-video object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity" 
                  loading="lazy"
                  onClick={() => openGallery(index)}
                />
              ))}
              {screenshots.length > 3 && (
                <div 
                  className="relative w-full aspect-video rounded-lg shadow-md overflow-hidden group cursor-pointer"
                  onClick={() => openGallery(3)}
                >
                  <img 
                    src={screenshots[3]} 
                    alt="Screenshot 4" 
                    className="w-full h-full object-cover group-hover:blur-sm transition-all" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="text-white mr-2" />
                    <span className="text-white text-sm">View All Media</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Image Gallery */}
      {galleryOpen && screenshots.length > 0 && (
        <ImageGallery
          images={screenshots}
          initialIndex={galleryInitialIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
};

export default GameMediaPreview;