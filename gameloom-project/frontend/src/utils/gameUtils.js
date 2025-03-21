export const getUpcomingFeaturedGames = (games, count = 4) => {
  if (!games || games.length === 0) return [];
  
  const now = new Date();
  
  // Minimum hype score required for a game to be considered "anticipated"
  const MIN_HYPE_THRESHOLD = 50;
  
  // Detects placeholder release dates (usually December 31st)
  const isPlaceholderDate = (dateString) => {
    const date = new Date(dateString);
    return date.getMonth() === 11 && date.getDate() === 31; // December 31st
  };
  
  // Filter by upcoming games with release dates and sort by nearest release date
  const upcomingGames = games
    .filter(game => {
      if (!game.firstReleaseDate) return false;
      const releaseDate = new Date(game.firstReleaseDate);
      return releaseDate > now && (game.hypes || 0) >= MIN_HYPE_THRESHOLD;
    })
    .sort((a, b) => {
      return new Date(a.firstReleaseDate) - new Date(b.firstReleaseDate);
    });
  
  // If we have fewer games than requested, return all of them
  if (upcomingGames.length <= count) {
    return upcomingGames;
  }
  
  const result = [];
  
  // Separate games with real dates from those with placeholder dates
  const gamesWithPreciseDates = upcomingGames.filter(game => !isPlaceholderDate(game.firstReleaseDate));
  const gamesWithPlaceholderDates = upcomingGames.filter(game => isPlaceholderDate(game.firstReleaseDate));
  
  // Selection strategy for featured games
  
  // 1. Include the next upcoming game with a precise release date
  if (gamesWithPreciseDates.length > 0) {
    result.push(gamesWithPreciseDates[0]);
  } else if (upcomingGames.length > 0) {
    result.push(upcomingGames[0]);
  }
  
  // 2. Include a game releasing in 1-3 months with high hype score
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(now.getMonth() + 1);
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(now.getMonth() + 3);
  
  const mediumTermGames = gamesWithPreciseDates.filter(game => {
    const releaseDate = new Date(game.firstReleaseDate);
    return releaseDate >= oneMonthFromNow && releaseDate <= threeMonthsFromNow;
  });
  
  if (mediumTermGames.length > 0) {
    const highestHypeMediumTerm = [...mediumTermGames].sort((a, b) => 
      (b.hypes || 0) - (a.hypes || 0)
    )[0];
    
    if (highestHypeMediumTerm && !result.find(g => g.id === highestHypeMediumTerm.id)) {
      result.push(highestHypeMediumTerm);
    }
  }
  
  // 3. Include a game releasing in 3-6 months with high hype score
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(now.getMonth() + 6);
  
  const longerTermGames = gamesWithPreciseDates.filter(game => {
    const releaseDate = new Date(game.firstReleaseDate);
    return releaseDate > threeMonthsFromNow && releaseDate <= sixMonthsFromNow;
  });
  
  if (longerTermGames.length > 0) {
    const highestHypeLongerTerm = [...longerTermGames].sort((a, b) => 
      (b.hypes || 0) - (a.hypes || 0)
    )[0];
    
    if (highestHypeLongerTerm && !result.find(g => g.id === highestHypeLongerTerm.id)) {
      result.push(highestHypeLongerTerm);
    }
  }
  
  // 4. Fill remaining slots with highest hyped games
  if (result.length < count) {
    // Prioritize games with precise release dates
    const remainingPreciseDateGames = gamesWithPreciseDates
      .filter(game => !result.find(g => g.id === game.id))
      .sort((a, b) => (b.hypes || 0) - (a.hypes || 0))
      .slice(0, count - result.length);
    
    result.push(...remainingPreciseDateGames);
    
    // Use placeholder date games if needed to reach requested count
    if (result.length < count) {
      const remainingPlaceholderGames = gamesWithPlaceholderDates
        .filter(game => !result.find(g => g.id === game.id))
        .sort((a, b) => (b.hypes || 0) - (a.hypes || 0))
        .slice(0, count - result.length);
      
      result.push(...remainingPlaceholderGames);
    }
  }
  
  return result;
}; 