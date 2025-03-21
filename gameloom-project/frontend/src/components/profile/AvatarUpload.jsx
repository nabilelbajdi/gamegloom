import React, { useState, useRef, useEffect } from 'react';
import { Upload, ZoomIn, ZoomOut, Loader2, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadAvatar } from '../../api';
import useClickOutside from '../../hooks/useClickOutside';

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
  const modalRef = useRef(null);
  
  // Use the click outside hook correctly
  const handleClose = () => {
    if (!isUploading) {
      onClose();
    }
  };
  
  // Initialize the useClickOutside hook correctly
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUploading]);

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

  const formatFileSize = (size) => {
    if (size < 1024) {
      return size + ' B';
    } else if (size < 1024 * 1024) {
      return Math.round(size / 1024) + ' kB';
    } else {
      return Math.round(size / (1024 * 1024)) + ' MB';
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div 
        ref={modalRef}
        className="bg-surface-dark rounded-lg w-full max-w-md border border-gray-800/50 shadow-xl overflow-hidden" 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-0 p-4 border-b border-gray-800/30">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Update Profile Picture
          </h3>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-300 cursor-pointer text-xl"
            disabled={isUploading}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {/* Current or Preview Image with Crop Controls */}
          <div className="relative mb-6">
            <div 
              ref={previewContainerRef}
              className="w-48 h-48 rounded-full overflow-hidden bg-gray-800 mb-4 flex items-center justify-center border-2 border-gray-800/30"
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
              <div className="flex items-center justify-center gap-3 mb-2 mt-3">
                <button 
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-gray-300 transition-colors cursor-pointer"
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                
                <div className="flex-1 max-w-[100px] flex items-center">
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.1" 
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-1 accent-primary cursor-pointer bg-gray-700/30 rounded-full appearance-none"
                  />
                </div>
                
                <button 
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-gray-300 transition-colors cursor-pointer"
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
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
            <div className="flex-1 flex items-center gap-3 py-2 px-2 bg-black/10 hover:bg-black/15 rounded transition-colors">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-1.5 flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-gray-100 transition-colors cursor-pointer"
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 text-primary" />
                {selectedFile ? 'Choose a different photo' : 'Select a photo'}
              </button>
            </div>
            
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
              <div className="flex items-center justify-center gap-2 text-red-400 text-xs bg-red-900/10 p-3 border border-red-900/30 rounded text-center">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {selectedFile && (
              <p className="text-gray-400 text-xs text-center">
                {selectedFile.name.length > 25 
                  ? `${selectedFile.name.substring(0, 22)}...` 
                  : selectedFile.name
                } • {formatFileSize(selectedFile.size)}
              </p>
            )}
          </div>
        </div>

        <div className="p-4 flex justify-end gap-5 border-t border-gray-800/30">
          <button
            onClick={handleClose}
            className="text-xs font-medium text-gray-400 hover:text-gray-300 cursor-pointer"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`text-xs font-semibold flex items-center gap-2 ${
              !selectedFile || isUploading ? 'text-gray-500 cursor-not-allowed' : 'text-primary hover:text-primary/90 cursor-pointer'
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
      </motion.div>
    </motion.div>
  );
};

export default AvatarUpload; 