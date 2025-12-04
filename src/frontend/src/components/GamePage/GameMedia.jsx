// src/components/GamePage/GameMedia.jsx
import React, { useState } from "react";
import { Video, Image, Film, ChevronRight, ChevronLeft } from "lucide-react";
import ImageGallery from "../common/ImageGallery";
import TabNavigation from "../common/TabNavigation";

const ITEMS_PER_PAGE = 5;

const GameMedia = React.memo(({ screenshots, videos, artworks }) => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState(null);

  const tabs = [
    { id: 'screenshots', title: 'Screenshots', icon: <Film className="w-4 h-4 mr-1" />, content: screenshots },
    { id: 'videos', title: 'Videos', icon: <Video className="w-4 h-4 mr-1" />, content: videos },
    { id: 'artworks', title: 'Artworks', icon: <Image className="w-4 h-4 mr-1" />, content: artworks },
  ].filter(tab => tab.content && tab.content.length > 0);

  // Check if any media content exists
  if (tabs.length === 0) {
    return null;
  }

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  // Function to open the gallery
  const openGallery = (images, initialIndex) => {
    setGalleryImages(images);
    setGalleryInitialIndex(initialIndex);
    setGalleryOpen(true);
  };

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-light mb-4">Media</h2>
      
      {/* Tab Navigation */}
      <TabNavigation tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Media Content Sections */}
      {activeTab === 'videos' && videos && videos.length > 0 && (
        <MediaSection 
          type="videos"
          items={videos}
          openGallery={openGallery}
        />
      )}
      
      {activeTab === 'artworks' && artworks && artworks.length > 0 && (
        <MediaSection 
          type="artworks"
          items={artworks}
          openGallery={openGallery}
        />
      )}
      
      {activeTab === 'screenshots' && screenshots && screenshots.length > 0 && (
        <MediaSection 
          type="screenshots"
          items={screenshots}
          openGallery={openGallery}
        />
      )}

      {/* Image Gallery */}
      {galleryOpen && galleryImages && (
        <ImageGallery
          images={galleryImages}
          initialIndex={galleryInitialIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </section>
  );
});

// Media section with pagination
const MediaSection = ({ type, items, openGallery }) => {
  return (
    <div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {items.map((item, index) => (
          type === 'videos' ? (
            <iframe
              key={index}
              width="320"
              height="180"
              src={item}
              title={`Video ${index + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg shadow-md flex-shrink-0 transition-transform hover:scale-[1.02] border-0"
            ></iframe>
          ) : (
            <div 
              key={index} 
              className="flex-shrink-0 snap-center transition-transform hover:scale-[1.02]"
              style={{ width: '320px', height: '180px' }}
            >
              <img
                src={item}
                alt={`${type.slice(0, -1)} ${index + 1}`}
                className="w-full h-full object-cover rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openGallery(items, index)}
              />
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default GameMedia;
