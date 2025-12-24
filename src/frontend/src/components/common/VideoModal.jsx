import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const VideoModal = ({ videoUrl, onClose }) => {
    // Extract YouTube video ID from embed URL
    const getYouTubeId = (url) => {
        if (!url) return null;
        const match = url.match(/youtube\.com\/embed\/([^?]+)/);
        return match ? match[1] : null;
    };

    const videoId = getYouTubeId(videoUrl);

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!videoId) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Modal Content */}
            <div
                className="relative w-full max-w-5xl mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close video"
                >
                    <X className="w-8 h-8" />
                </button>

                {/* Video Container - 16:9 Aspect Ratio */}
                <div className="relative w-full pb-[56.25%] bg-black rounded-lg overflow-hidden shadow-2xl">
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        title="Game Trailer"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
};

export default VideoModal;
