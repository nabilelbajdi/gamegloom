// Display helpers for IGDB game data: image upscaling, hero art selection, and
// platform label shortening.
//
// Not to be confused with getHighResImageUrl in gameUtils.js, which targets the
// retina _2x variants. This module targets plain t_1080p.

// IGDB serves every image through a URL carrying a size token (e.g. /t_thumb/).
// Swapping that token for t_1080p yields the full-resolution asset.
export const getHighResImage = (url) => {
  if (!url || !url.includes("/t_")) return url;
  return url.replace(/\/t_[^/]+\//, "/t_1080p/");
};

// Best available background art: first artwork, else first screenshot, else
// null so callers can apply their own fallback. Indexing is deliberately fixed
// rather than random so the chosen image is stable across re-renders.
export const pickHeroArt = (game) => {
  if (game?.artworks?.length) return getHighResImage(game.artworks[0]);
  if (game?.screenshots?.length) return getHighResImage(game.screenshots[0]);
  return null;
};

// Only platforms with an established short label. Filter UIs persist these
// strings in the URL, so adding entries here invalidates saved and shared links.
const PLATFORM_SHORT_NAMES = {
  "PC (Microsoft Windows)": "PC",
  "PlayStation 5": "PS5",
  "PlayStation 4": "PS4",
  "PlayStation 3": "PS3",
  "PlayStation 2": "PS2",
  "Nintendo Switch": "Switch",
};

// Unknown platforms pass through unchanged.
export const shortenPlatform = (name) =>
  typeof name === "string" ? PLATFORM_SHORT_NAMES[name.trim()] ?? name.trim() : name;

// A whole comma-separated platform list, shortened and alphabetised.
export const shortPlatforms = (platforms) => {
  if (typeof platforms !== "string" || !platforms) return "";
  return platforms
    .split(",")
    .map((p) => shortenPlatform(p))
    .sort()
    .join(", ");
};
