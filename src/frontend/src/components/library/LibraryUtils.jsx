// Filter games by search query
export const filterGamesBySearch = (games, searchQuery) => {
  if (!searchQuery) return games;
  return games.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
};

// Get active games based on tab selection
export const getActiveGames = (collection, activeTab, selectedList, myLists, searchQuery) => {
  if (!collection) return [];

  const allGames = [
    ...(collection.want_to_play || []),
    ...(collection.playing || []),
    ...(collection.played || [])
  ];

  switch (activeTab) {
    case "all":
      return filterGamesBySearch(allGames, searchQuery);
    case "want_to_play":
      return filterGamesBySearch(collection.want_to_play || [], searchQuery);
    case "playing":
      return filterGamesBySearch(collection.playing || [], searchQuery);
    case "played":
      return filterGamesBySearch(collection.played || [], searchQuery);
    case "my_lists":
      if (selectedList) {
        const list = myLists.find(list => list.id === selectedList);
        if (list && list.games) {
          return filterGamesBySearch(list.games, searchQuery);
        }
        return [];
      }
      return [];
    default:
      return filterGamesBySearch(allGames, searchQuery);
  }
};

// Sort games based on sort option
export const sortGames = (games, sortOption) => {
  if (!games) return [];

  switch (sortOption) {
    case "name-asc":
    case "name_asc":
      return [...games].sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
    case "name_desc":
      return [...games].sort((a, b) => b.name.localeCompare(a.name));
    case "rating-high":
    case "rating_high":
      return [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "rating-low":
    case "rating_low":
      return [...games].sort((a, b) => (a.rating || 0) - (b.rating || 0));
    case "release-old":
    case "release_old":
      return [...games].sort((a, b) => new Date(a.first_release_date || 0) - new Date(b.first_release_date || 0));
    case "release-new":
    case "release_new":
      return [...games].sort((a, b) => new Date(b.first_release_date || 0) - new Date(a.first_release_date || 0));
    case "added-new":
    case "added_new":
      return [...games].sort((a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0));
    case "added-old":
    case "added_old":
      return [...games].sort((a, b) => new Date(a.added_at || 0) - new Date(b.added_at || 0));
    case "playtime_high":
      return [...games].sort((a, b) => (b.playtime_minutes || 0) - (a.playtime_minutes || 0));
    case "playtime_low":
      return [...games].sort((a, b) => (a.playtime_minutes || 0) - (b.playtime_minutes || 0));
    case "last_played":
      // Sort by last_played_at, with null values at the end
      return [...games].sort((a, b) => {
        const aDate = a.last_played_at ? new Date(a.last_played_at) : null;
        const bDate = b.last_played_at ? new Date(b.last_played_at) : null;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return bDate - aDate;
      });
    default:
      // Default to date added (newest first)
      return [...games].sort((a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0));
  }
}; 