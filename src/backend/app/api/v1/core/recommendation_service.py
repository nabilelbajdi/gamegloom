# core/recommendation_service.py
"""
Content-based game recommendations.

Scores candidate games by overlap with the user's taste signals — onboarding
genre/theme picks (user_preferences) plus their library — and boosts games that
IGDB lists as "similar" to ones they already track. No ML, no heavy deps: pure
SQL + Python, so it runs comfortably on free-tier infra and is fully cacheable.
Content-based scoring also handles the cold-start case well: a brand-new user
who just picked a few genres in onboarding gets a real feed immediately.
"""
from sqlalchemy.orm import Session, load_only

from ..models.game import Game
from ..models.user_game import UserGame

# Relative weights for the score components.
_GENRE_WEIGHT = 10.0
_THEME_WEIGHT = 6.0
_SIMILAR_WEIGHT = 8.0
_QUALITY_WEIGHT = 1.0  # total_rating/100 contributes ~0..1


def _term(slug: str) -> str:
    """Normalize a genre/theme slug to a loose match term ('visual-novel' -> 'visual novel')."""
    return slug.replace("-", " ").strip().lower()


def _collect_taste(prefs, library_games) -> tuple[set[str], set[str], set[int]]:
    """Derive (genre_terms, theme_terms, similar_igdb_ids) from prefs + library.

    Explicit onboarding picks take priority; when a dimension has no picks we fall
    back to the genres/themes of the user's library so existing users still get
    personalized results without having onboarded.
    """
    genre_terms: set[str] = set()
    theme_terms: set[str] = set()
    if prefs:
        genre_terms = {_term(g) for g in (prefs.favorite_genres or []) if g}
        theme_terms = {_term(t) for t in (prefs.favorite_themes or []) if t}

    similar_ids: set[int] = set()
    for g in library_games:
        if not genre_terms and g.genres:
            genre_terms.update(part.strip().lower() for part in g.genres.split(",") if part.strip())
        if not theme_terms and g.themes:
            theme_terms.update(part.strip().lower() for part in g.themes.split(",") if part.strip())
        for sim in (g.similar_games or []):
            if isinstance(sim, dict) and sim.get("id"):
                similar_ids.add(sim["id"])
    return genre_terms, theme_terms, similar_ids


def score_game(game: Game, genre_terms: set[str], theme_terms: set[str], similar_ids: set[int]) -> float:
    """Content-based score for one candidate game."""
    gtext = (game.genres or "").lower()
    ttext = (game.themes or "").lower()
    score = 0.0
    score += _GENRE_WEIGHT * sum(1 for t in genre_terms if t and t in gtext)
    score += _THEME_WEIGHT * sum(1 for t in theme_terms if t and t in ttext)
    if game.igdb_id in similar_ids:
        score += _SIMILAR_WEIGHT
    score += _QUALITY_WEIGHT * ((game.total_rating or 0) / 100.0)
    return score


# Only the columns scoring needs — a Game row carries ~20 fat JSON columns we
# never touch while ranking, so we load the thin set for the pool/library and
# hydrate full rows for just the winners. Keeps Neon egress proportional to the
# result size instead of the 500-row candidate pool.
_SCORE_COLUMNS = (Game.id, Game.igdb_id, Game.genres, Game.themes, Game.similar_games, Game.total_rating)


def recommend_games(db: Session, user_id: int, prefs, limit: int = 50, pool_size: int = 500) -> list[Game]:
    """Return up to `limit` recommended games, excluding the user's library."""
    library = (
        db.query(Game)
        .options(load_only(*_SCORE_COLUMNS))
        .join(UserGame, UserGame.game_id == Game.id)
        .filter(UserGame.user_id == user_id)
        .all()
    )
    library_ids = {g.id for g in library}
    genre_terms, theme_terms, similar_ids = _collect_taste(prefs, library)

    # Bounded candidate pool: rated games with a cover, not already in the library.
    q = (
        db.query(Game)
        .options(load_only(*_SCORE_COLUMNS))
        .filter(Game.cover_image.isnot(None), Game.total_rating.isnot(None))
    )
    if library_ids:
        q = q.filter(~Game.id.in_(library_ids))
    candidates = q.order_by(Game.total_rating.desc()).limit(pool_size).all()

    # No taste signal at all (no prefs, empty library) -> quality-ranked fallback.
    if not (genre_terms or theme_terms or similar_ids):
        winners = candidates[:limit]
    else:
        candidates.sort(
            key=lambda g: score_game(g, genre_terms, theme_terms, similar_ids),
            reverse=True,
        )
        winners = candidates[:limit]

    # Hydrate full rows for only the winners (the response serializes every field),
    # preserving the ranked order.
    winner_ids = [g.id for g in winners]
    if not winner_ids:
        return []
    by_id = {g.id: g for g in db.query(Game).filter(Game.id.in_(winner_ids)).all()}
    return [by_id[i] for i in winner_ids if i in by_id]
