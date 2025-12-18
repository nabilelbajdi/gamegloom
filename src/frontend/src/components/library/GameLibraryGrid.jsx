import React, { useMemo } from "react";
import GameGrid from "../common/GameGrid";
import GamesList from "../common/GamesList";
import { EmptyLists } from "./EmptyState";
import { getActiveGames, sortGames } from "./LibraryUtils";
import { gamePassesAllFilters } from "../../utils/filterUtils";

const GameLibraryGrid = ({
  collection,
  activeTab,
  selectedList,
  myLists,
  searchQuery,
  viewMode = "grid",
  sortOption,
  activeFilters
}) => {
  // Get filtered and sorted games list
  const activeGamesList = useMemo(() => {
    const filteredGames = getActiveGames(collection, activeTab, selectedList, myLists, searchQuery);

    // Apply content type filter if specified in activeFilters
    const contentTypeFiltered = activeFilters.contentTypes?.length
      ? filteredGames.filter(game =>
        game.game_type_name && (
          activeFilters.contentTypes.includes(game.game_type_name) ||
          (game.game_type_name === "Main Game" && activeFilters.contentTypes.includes("Base Game"))
        )
      )
      : filteredGames;

    // Apply other filters
    const filteredByOptions = contentTypeFiltered.filter(game =>
      gamePassesAllFilters(game, {
        genres: activeFilters.genres,
        themes: activeFilters.themes,
        platforms: activeFilters.platforms,
        gameModes: activeFilters.gameModes,
        playerPerspectives: activeFilters.playerPerspectives,
        minRating: activeFilters.minRating
      })
    );

    return sortGames(filteredByOptions, sortOption);
  }, [activeTab, sortOption, searchQuery, activeFilters, collection, selectedList, myLists]);

  // Render empty lists state
  if (activeTab === "my_lists" && myLists.length === 0) {
    return <EmptyLists />;
  }

  // No games found message
  const NoGamesFound = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h3 className="text-xl font-semibold text-light mb-2">No games found</h3>
      <p className="text-light/70 max-w-md mb-6">
        We couldn't find any games matching your criteria.
      </p>
    </div>
  );

  return (
    <>
      {/* Game Grid or List */}
      {viewMode === "grid" ? (
        <GameGrid
          games={activeGamesList}
          loading={false}
          emptyContent={activeGamesList.length === 0 ? <NoGamesFound /> : null}
          collection={collection}
          searchQuery={searchQuery}
          isSearching={!!searchQuery}
          showResultCount={false}
          containerClassName="container mx-auto"
          columnCount={{ default: 2, sm: 3, md: 4, lg: 4, xl: 4 }}
        />
      ) : (
        <GamesList
          games={activeGamesList}
          loading={false}
        />
      )}
    </>
  );
};

export default GameLibraryGrid; 