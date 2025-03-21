import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const ImageGallery = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);

  // Function to handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") navigatePrev();
    if (e.key === "ArrowRight") navigateNext();
  }, [currentIndex, images?.length]);

  // Navigation functions
  const navigateNext = () => {
    if (!images || images.length === 0) return;
    setLoading(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const navigatePrev = () => {
    if (!images || images.length === 0) return;
    setLoading(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  // Go to a specific image
  const goToImage = (index) => {
    setLoading(true);
    setCurrentIndex(index);
  };

  // Add keyboard event listeners
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [handleKeyDown]);

  // Convert thumbnail URLs to high resolution (1080p)
  const getHighResImage = (url) => {
    if (!url || !url.includes('/t_')) return url;
    return url.replace(/\/t_[^/]+\//, '/t_1080p/');
  };

  if (!images || images.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
        aria-label="Close gallery"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main image */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={getHighResImage(images[currentIndex])}
          alt={`Image ${currentIndex + 1}`}
          className={`max-h-[85vh] max-w-[85vw] object-contain transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
        />
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={navigatePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={navigateNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Thumbnails */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] py-2 px-4 bg-black/50 rounded-lg">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`relative flex-shrink-0 w-16 h-10 overflow-hidden rounded transition-all ${
              currentIndex === index 
                ? 'ring-2 ring-primary scale-105' 
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Image counter */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>,
    document.body
  );
};

export default ImageGallery; 