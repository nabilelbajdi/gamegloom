from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Dict
from ..models.game import Game

class SemanticAnalyzer:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            max_features=10000,
            ngram_range=(1, 2)
        )
        self.game_vectors = None
        self.game_ids = None

    def _prepare_text(self, game: Game) -> str:
        """Combine and clean game text data for analysis."""
        text_parts = []
        
        if game.summary:
            text_parts.append(game.summary)
        if game.storyline:
            text_parts.append(game.storyline)
        if game.keywords:
            text_parts.extend(game.keywords)
        if game.themes:
            text_parts.extend(t.strip() for t in game.themes.split(','))
        if game.genres:
            text_parts.extend(g.strip() for g in game.genres.split(','))
            
        return ' '.join(text_parts)

    def calculate_semantic_similarities(self, user_games: List[Game], candidate_games: List[Game]) -> Dict[int, float]:
        """Calculate semantic similarity scores between user's games and candidate games."""
        all_games = user_games + candidate_games
        game_texts = [self._prepare_text(game) for game in all_games]
        
        # Create TF-IDF vectors
        try:
            vectors = self.vectorizer.fit_transform(game_texts)
        except ValueError:
            # Handle empty text case
            return {game.id: 0.0 for game in candidate_games}
        
        # Calculate similarities
        user_vectors = vectors[:len(user_games)]
        candidate_vectors = vectors[len(user_games):]
        
        # Calculate mean similarity between each candidate and all user games
        similarities = cosine_similarity(candidate_vectors, user_vectors)
        mean_similarities = np.mean(similarities, axis=1)
        
        # Create dictionary of game ID to similarity score
        return {
            game.id: float(score)
            for game, score in zip(candidate_games, mean_similarities)
        } 