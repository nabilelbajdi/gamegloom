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
        return list ? filterGamesBySearch(list.games || [], searchQuery) : [];
      }
      return [];
    default:
      return filterGamesBySearch(allGames, searchQuery);
  }
};

// Sort games based on sort option
export const sortGames = (games, sortOption) => {
  switch (sortOption) {
    case "name_asc":
      return [...games].sort((a, b) => a.name.localeCompare(b.name));
    case "name_desc":
      return [...games].sort((a, b) => b.name.localeCompare(a.name));
    case "rating_high":
      return [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "rating_low":
      return [...games].sort((a, b) => (a.rating || 0) - (b.rating || 0));
    case "release_old":
      return [...games].sort((a, b) => new Date(a.first_release_date || 0) - new Date(b.first_release_date || 0));
    default:
      // Newest releases as default
      return [...games].sort((a, b) => new Date(b.first_release_date || 0) - new Date(a.first_release_date || 0));
  }
}; 