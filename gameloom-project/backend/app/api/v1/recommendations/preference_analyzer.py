from collections import Counter
from typing import List, Dict, Any
from ..models.game import Game

class PreferenceAnalyzer:
    def __init__(self):
        self.preferences = {
            'genres': Counter(),
            'themes': Counter(),
            'platforms': Counter(),
            'game_modes': Counter(),
            'player_perspectives': Counter(),
            'developers': Counter(),
            'franchises': Counter(),
            'keywords': Counter()
        }
        self.max_counts = {}

    def analyze_user_games(self, games: List[Game]) -> None:
        """Analyze user's game collection to build comprehensive preference profiles."""
        # Reset counters
        for counter in self.preferences.values():
            counter.clear()

        # Count preferences across all attributes
        for game in games:
            # Process comma-separated string fields
            for field in ['genres', 'themes', 'platforms', 'game_modes', 'player_perspectives']:
                value = getattr(game, field, None)
                if value:
                    self.preferences[field].update(item.strip() for item in value.split(','))
            
            # Process developer preferences
            if game.developers:
                self.preferences['developers'].update(dev.strip() for dev in game.developers.split(','))
            
            # Process franchise preferences
            if game.franchise:
                self.preferences['franchises'][game.franchise] += 1
            if game.franchises:
                self.preferences['franchises'].update(game.franchises)
            
            # Process keywords
            if game.keywords:
                self.preferences['keywords'].update(game.keywords)

        # Calculate max counts for normalization
        self.max_counts = {
            category: max(counter.values()) if counter else 1
            for category, counter in self.preferences.items()
        }

    def get_normalized_preferences(self) -> Dict[str, Dict[str, float]]:
        """Get normalized preference scores for each category."""
        return {
            category: {
                item: count / self.max_counts[category]
                for item, count in counter.items()
            }
            for category, counter in self.preferences.items()
        }

    def calculate_preference_score(self, game: Game, category: str, items: List[str]) -> float:
        """Calculate normalized preference score for a specific category."""
        if not items or category not in self.preferences or not self.max_counts.get(category):
            return 0.0
        
        scores = [
            self.preferences[category][item] / self.max_counts[category]
            for item in items
            if item in self.preferences[category]
        ]
        return sum(scores) / len(scores) if scores else 0.0 