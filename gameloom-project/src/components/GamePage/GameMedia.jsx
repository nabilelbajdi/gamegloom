// src/components/GamePage/GameMedia.jsx
import React, { useState } from "react";
import ImageGallery from "../common/ImageGallery";

const GameMedia = React.memo(({ screenshots, videos, artworks }) => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState(null);

  // Function to open the gallery
  const openGallery = (images, initialIndex) => {
    setGalleryImages(images);
    setGalleryInitialIndex(initialIndex);
    setGalleryOpen(true);
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Media</h2>
      
      {/* Videos Section */}
      {videos && videos.length > 0 && (
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

      {/* Artworks Section */}
      {artworks && artworks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">Artworks</h3>
          <div className="flex gap-4 overflow-x-auto">
            {artworks.map((artwork, index) => (
              <img
                key={index}
                src={artwork}
                alt={`Artwork ${index + 1}`}
                className="w-64 h-36 object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openGallery(artworks, index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Screenshots Section */}
      {screenshots && screenshots.length > 0 && (
        <div>
          <h3 className="text-md font-semibold mb-2">Screenshots</h3>
          <div className="flex gap-4 overflow-x-auto">
            {screenshots.map((screenshot, index) => (
              <img
                key={index}
                src={screenshot}
                alt={`Screenshot ${index + 1}`}
                className="w-64 h-36 object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openGallery(screenshots, index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {galleryOpen && galleryImages && (
        <ImageGallery
          images={galleryImages}
          initialIndex={galleryInitialIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
});

export default GameMedia;
