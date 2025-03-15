import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Loader2, ZoomIn, ZoomOut, Upload, AlertCircle } from 'lucide-react';
import { uploadAvatar } from '../../api';

const AvatarUpload = ({ currentAvatar, onAvatarUpdate, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  // Cropping/zoom state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const previewContainerRef = useRef(null);

  // Preload the current avatar
  useEffect(() => {
    if (currentAvatar && !previewUrl) {
      const img = new Image();
      img.src = currentAvatar;
    }
  }, [currentAvatar]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPEG, PNG, GIF and WEBP images are allowed');
      return;
    }

    setError('');
    setSelectedFile(file);
    setZoom(1);
    setPosition({ x: 0, y: 0 });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleMouseDown = (e) => {
    if (!selectedFile) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const maxOffset = 150 * (zoom - 1);
    
    setPosition({
      x: Math.max(Math.min(e.clientX - dragStart.x, maxOffset), -maxOffset),
      y: Math.max(Math.min(e.clientY - dragStart.y, maxOffset), -maxOffset)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    // Add event listeners for mouse movement outside the component
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError('');

      if (!previewContainerRef.current) {
        throw new Error("Preview container reference not available");
      }

      // Get the actual dimensions of the preview container
      const containerRect = previewContainerRef.current.getBoundingClientRect();
      const containerSize = containerRect.width;

      // Create a canvas to apply the zoom and position
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to desired output size (circle dimensions)
      const outputSize = 400;
      canvas.width = outputSize;
      canvas.height = outputSize;
      
      // Draw a circular clipping path for the avatar
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      // Create an image element from the preview
      const img = new Image();
      img.src = previewUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Calculate the size of the image as it would appear in the preview
      const imageAspectRatio = img.width / img.height;
      
      let naturalWidth, naturalHeight;
      
      if (imageAspectRatio > 1) {
        // Image is wider than container
        naturalHeight = containerSize;
        naturalWidth = naturalHeight * imageAspectRatio;
      } else {
        // Image is taller than container
        naturalWidth = containerSize;
        naturalHeight = naturalWidth / imageAspectRatio;
      }
      
      // Apply the zoom and position from the UI
      const zoomedWidth = naturalWidth * zoom;
      const zoomedHeight = naturalHeight * zoom;
      
      // Scale up to output size
      const scaleFactor = outputSize / containerSize;
      
      // Draw the image with the zoom and position applied
      ctx.drawImage(
        img,
        0, 0, img.width, img.height,
        (outputSize - zoomedWidth * scaleFactor) / 2 + position.x * scaleFactor, 
        (outputSize - zoomedHeight * scaleFactor) / 2 + position.y * scaleFactor,
        zoomedWidth * scaleFactor, 
        zoomedHeight * scaleFactor
      );
      
      // Fill any transparent areas with white background
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] === 0) {
          pixels[i] = 255;
          pixels[i + 1] = 255;
          pixels[i + 2] = 255;
          pixels[i + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      
      // Convert the canvas to a blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });
      
      // Create a File object from the blob
      const processedFile = new File(
        [blob],
        `processed-${selectedFile.name}`,
        { type: 'image/jpeg' }
      );
      
      // Create form data with the processed image
      const formData = new FormData();
      formData.append('file', processedFile);

      const updatedUser = await uploadAvatar(formData);
      
      // Add a cache-busting parameter to force reload
      const newAvatarUrl = `${updatedUser.avatar}?t=${new Date().getTime()}`;
      
      // Wait a moment to ensure the server has processed the image
      setTimeout(() => {
        onAvatarUpdate(newAvatarUrl);
        onClose();
      }, 300);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
      <div 
        className="bg-surface-dark rounded-xl w-full max-w-md shadow-2xl overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Update Profile Picture</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-800"
            disabled={isUploading}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {/* Current or Preview Image with Crop Controls */}
          <div className="relative mb-6">
            <div 
              ref={previewContainerRef}
              className="w-48 h-48 rounded-full overflow-hidden bg-gray-800 mb-4 flex items-center justify-center border-2 border-gray-700/50"
              onMouseDown={handleMouseDown}
              style={{ cursor: selectedFile ? 'grab' : 'default' }}
            >
              {selectedFile ? (
                <div style={{ 
                  transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    className="min-w-full min-h-full object-cover"
                    draggable="false"
                  />
                </div>
              ) : (
                <img
                  src={currentAvatar || '/images/default-avatar.svg'}
                  alt="Current avatar"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Zoom controls */}
            {selectedFile && (
              <div className="flex items-center justify-center gap-4 mb-2">
                <button 
                  onClick={handleZoomOut}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                
                <div className="flex-1 max-w-[120px]">
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.1" 
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
                
                <button 
                  onClick={handleZoomIn}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {selectedFile && (
              <p className="text-center text-xs text-gray-400 mb-3">
                Drag to position • Zoom to adjust
              </p>
            )}
          </div>

          {/* Upload controls */}
          <div className="w-full space-y-4">
            {/* File input button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300 text-sm font-medium transition-colors"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" />
              {selectedFile ? 'Choose a different photo' : 'Select a photo'}
            </button>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              disabled={isUploading}
            />

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {selectedFile && (
              <p className="text-gray-400 text-xs">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        <div className="p-5 flex justify-end gap-3 bg-gray-800/30 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 text-sm transition-colors"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              !selectedFile ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-dark'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload; 