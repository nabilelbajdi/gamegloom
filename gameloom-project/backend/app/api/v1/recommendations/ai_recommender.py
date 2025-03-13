from sentence_transformers import SentenceTransformer
import torch
import logging
from typing import List, Dict
from ..models.game import Game

logger = logging.getLogger(__name__)

class AIRecommender:
    def __init__(self):
        """Initialize the AI recommender with a pre-trained model"""
        try:
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            self.cache = {}
        except Exception as e:
            logger.error(f"Error initializing AI recommender: {str(e)}")
            raise

    def create_game_embedding(self, game: Game) -> torch.Tensor:
        """
        Create an embedding vector for a game by combining its features.
        
        Args:
            game: Game object containing game information
            
        Returns:
            torch.Tensor: Embedding vector representing the game
        """
        if game.id in self.cache:
            return self.cache[game.id]
            
        try:
            game_text = f"""
            Title: {game.name}
            Genres: {game.genres or ''}
            Themes: {game.themes or ''}
            Game Modes: {game.game_modes or ''}
            Perspectives: {game.player_perspectives or ''}
            """
            
            embedding = self.model.encode(game_text)
            self.cache[game.id] = embedding
            return embedding
            
        except Exception as e:
            logger.error(f"Error creating embedding for game {game.id}: {str(e)}")
            return torch.zeros(384)

    def calculate_ai_scores(self, user_games: List[Game], candidate_games: List[Game]) -> Dict[int, float]:
        """
        Calculate AI similarity scores between user's games and candidate games.
        
        Args:
            user_games: List of games in user's collection
            candidate_games: List of potential games to recommend
            
        Returns:
            Dict[int, float]: Dictionary mapping game IDs to similarity scores
        """
        try:
            # Get embeddings for user's games
            user_embeddings = [self.create_game_embedding(game) for game in user_games]
            
            if not user_embeddings:
                logger.warning("No valid embeddings found for user games")
                return {game.id: 0.5 for game in candidate_games}
            
            # Calculate average user profile
            user_profile = torch.mean(torch.stack([torch.tensor(emb) for emb in user_embeddings]), dim=0)
            
            # Calculate similarities for each candidate game
            scores = {}
            for game in candidate_games:
                game_embedding = self.create_game_embedding(game)
                similarity = torch.cosine_similarity(
                    user_profile.unsqueeze(0),
                    torch.tensor(game_embedding).unsqueeze(0)
                ).item()
                # Normalize similarity to 0-1 range
                scores[game.id] = (similarity + 1) / 2
                
            return scores
            
        except Exception as e:
            logger.error(f"Error calculating AI scores: {str(e)}")
            return {game.id: 0.5 for game in candidate_games} 