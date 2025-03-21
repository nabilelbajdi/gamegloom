// Utility functions for game cards

// Format genres for display
export const formatGenres = (genres, maxCount = 3) => {
  if (!genres) return "Unknown Genre";
  
  // Convert string to array if needed
  let genreArray = Array.isArray(genres) 
    ? genres 
    : genres.split(',').map(g => g.trim());
  
  // Format each genre
  genreArray = genreArray.map(genre => {
    const trimmed = genre.trim();
    return trimmed === "Role-playing (RPG)" ? "RPG" : trimmed;
  });
  
  // Return the specified number of genres
  if (maxCount === 1) {
    return genreArray[0] || "Unknown Genre";
  }
  
  return genreArray.slice(0, maxCount).join(', ');
}; 