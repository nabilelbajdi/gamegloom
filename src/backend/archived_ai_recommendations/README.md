# Archived AI Recommendations

These files were archived on December 9, 2025 during codebase cleanup.

## Why Archived?

The AI recommendation system was disconnected from the active codebase. The `recommendations.py` router now uses a simplified heuristic (top-rated games not in user's library) for stability.

## What's Here

- `ai_recommender.py` - SentenceTransformer-based game embeddings
- `preference_analyzer.py` - User preference counting by category
- `semantic_analyzer.py` - TF-IDF semantic similarity

## To Restore

Before re-integrating, address these issues:

1. **Blocking I/O**: Run model inference in a thread pool or background worker to avoid blocking FastAPI's event loop.

2. **Persistent Cache**: Add Redis or database-backed cache for embeddings. Current in-memory cache resets on restart.

3. **Pre-computation**: Consider pre-computing embeddings for all games in DB, not on-demand.

4. **Dependencies**: Re-add to requirements.txt:
   ```
   torch>=2.6.0
   sentence-transformers>=3.4.0
   transformers>=4.49.0
   scikit-learn>=1.6.0
   ```

5. **Integration**: Update `recommendations.py` router to use these classes.
