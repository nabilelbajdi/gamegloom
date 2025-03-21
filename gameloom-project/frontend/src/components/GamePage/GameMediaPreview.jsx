// src/components/GamePage/GameMediaPreview.jsx
import React, { useState, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";
import ImageGallery from "../common/ImageGallery";

const GameMediaPreview = ({ screenshots = [], trailer }) => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [trailerUrl, setTrailerUrl] = useState("");

  useEffect(() => {
    if (trailer) {
      const url = new URL(trailer);
      url.searchParams.set("autoplay", "0");
      url.searchParams.set("mute", "1");
      setTrailerUrl(url.toString());
    }
  }, [trailer]);

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
            src={trailerUrl}
            title="Game Trailer"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            muted
            className="rounded-lg shadow-md border-0"
          ></iframe>
        </div>
      )}
      
      {/* Media Grid for trailer + screenshots or just screenshots */}
      {!hasOnlyTrailer && (
        <div className={`grid ${trailer ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
          {/* Trailer Grid Item */}
          {trailer && (
            <div className="aspect-video w-full md:col-span-2">
              <iframe
                width="100%"
                height="100%"
                src={trailerUrl}
                title="Game Trailer"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                muted
                className="rounded-lg shadow-md h-full border-0"
              ></iframe>
            </div>
          )}
          
          {/* Screenshots Grid */}
          {screenshots?.length > 0 && (
            <div className={`${trailer ? 'flex flex-col gap-3' : 'grid grid-cols-2 md:grid-cols-3 gap-3 md:col-span-3'}`}>
              {/* When trailer is present, show only one screenshot */}
              {trailer && screenshots.length > 0 && (
                <img 
                  src={screenshots[0]} 
                  alt="Screenshot 1" 
                  className="w-full aspect-video object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity" 
                  loading="lazy"
                  onClick={() => openGallery(0)}
                />
              )}
              
              {/* When trailer is not present, show multiple screenshots */}
              {!trailer && screenshots.slice(0, 5).map((screenshot, index) => (
                <img 
                  key={index} 
                  src={screenshot} 
                  alt={`Screenshot ${index + 1}`} 
                  className="w-full aspect-video object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity" 
                  loading="lazy"
                  onClick={() => openGallery(index)}
                />
              ))}
              
              {/* View All screenshots button */}
              {screenshots.length > (trailer ? 1 : 6) && (
                <div 
                  className="relative w-full aspect-video rounded-lg shadow-md overflow-hidden group cursor-pointer"
                  onClick={() => openGallery(trailer ? 1 : 6)}
                >
                  <img 
                    src={screenshots[trailer ? 1 : 6]} 
                    alt={trailer ? "Screenshot 2" : "Screenshot 7"} 
                    className="w-full h-full object-cover group-hover:blur-sm transition-all" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-80 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="text-white mr-2" />
                    <span className="text-white text-sm font-medium">View All Screenshots ({screenshots.length})</span>
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