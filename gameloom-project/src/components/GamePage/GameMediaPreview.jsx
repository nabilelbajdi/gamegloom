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

  return (
    <div className="flex flex-col md:flex-row gap-4 mt-6 items-start">
      {/* Trailer Preview */}
      {trailer && (
        <div className="flex-shrink-0 w-full md:w-1/2">
          <iframe
            width="100%"
            height="200"
            src={trailer}
            title="Game Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg shadow-md"
          ></iframe>
        </div>
      )}

      {/* Screenshots Preview */}
      {screenshots?.length > 0 && (
        <div className="grid grid-cols-2 gap-2 w-full md:w-1/2">
          {screenshots.slice(0, 3).map((screenshot, index) => (
            <img 
              key={index} 
              src={screenshot} 
              alt={`Screenshot ${index + 1}`} 
              className="w-full h-auto object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity" 
              loading="lazy"
              onClick={() => openGallery(index)}
            />
          ))}
          {screenshots.length > 3 && (
            <div 
              className="relative w-full h-auto rounded-lg shadow-md overflow-hidden group cursor-pointer"
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