// Utility functions for string operations

/**
 * Creates a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} A URL-friendly slug
 */
export const createSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}; 