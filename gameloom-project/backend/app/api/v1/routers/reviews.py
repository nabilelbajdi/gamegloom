from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import datetime, UTC

from ..core import schemas
from ..models.review import Review, ReviewLike, ReviewComment
from ..models.game import Game
from ..models.user import User
from ...db_setup import get_db
from ..core.auth import get_current_user

router = APIRouter(
    prefix="/reviews",
    tags=["reviews"]
)

@router.post("", response_model=schemas.Review)
async def create_review(
    review_data: schemas.ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new review for a game."""
    try:
        # Find game by IGDB ID
        game = db.query(Game).filter(Game.igdb_id == review_data.game_id).first()
        if not game:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Game with IGDB ID {review_data.game_id} not found"
            )
        
        # Check if game is released
        current_time = datetime.now(UTC)
        if game.first_release_date:
            game_release_date = game.first_release_date.replace(tzinfo=UTC)
            if game_release_date > current_time:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot review unreleased games"
                )
        
        # Check if user already reviewed this game
        existing = db.query(Review).filter(
            and_(
                Review.user_id == current_user.id,
                Review.game_id == game.id
            )
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this game"
            )
        
        # Create new review
        db_review = Review(
            user_id=current_user.id,
            game_id=game.id,
            rating=review_data.rating,
            content=review_data.content
        )
        
        db.add(db_review)
        
        user_rating_converted = (review_data.rating / 5) * 100
        
        if game.total_rating is not None and game.total_rating_count is not None:
            current_total = game.total_rating * game.total_rating_count
            new_total = current_total + user_rating_converted
            new_count = game.total_rating_count + 1
            new_rating = new_total / new_count
            
            game.total_rating = new_rating
            game.total_rating_count = new_count
        else:
            game.total_rating = user_rating_converted
            game.total_rating_count = 1
        
        db.commit()
        db.refresh(db_review)
        return db_review
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the review: {str(e)}"
        )

@router.get("/game/{igdb_id}", response_model=List[schemas.Review])
async def get_game_reviews(
    igdb_id: int,
    db: Session = Depends(get_db)
):
    """Get all reviews for a specific game."""
    game = db.query(Game).filter(Game.igdb_id == igdb_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    reviews = db.query(Review).join(User).filter(Review.game_id == game.id).all()
    return reviews

@router.get("/{review_id}", response_model=schemas.Review)
async def get_review(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific review by ID."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    return review

@router.put("/{review_id}", response_model=schemas.Review)
async def update_review(
    review_id: int,
    review_data: schemas.ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a review."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this review"
        )
    
    game = db.query(Game).filter(Game.id == review.game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    if "rating" in review_data.model_dump(exclude_unset=True) and review_data.rating != review.rating:
        old_rating_converted = (review.rating / 5) * 100
        new_rating_converted = (review_data.rating / 5) * 100
        
        if game.total_rating is not None and game.total_rating_count is not None:
            current_total = game.total_rating * game.total_rating_count
            adjusted_total = current_total - old_rating_converted + new_rating_converted
            new_rating = adjusted_total / game.total_rating_count
            
            game.total_rating = new_rating
    
    for key, value in review_data.model_dump(exclude_unset=True).items():
        setattr(review, key, value)
    
    db.commit()
    db.refresh(review)
    return review

@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a review."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this review"
        )

    game = db.query(Game).filter(Game.id == review.game_id).first()
    if game and game.total_rating is not None and game.total_rating_count is not None and game.total_rating_count > 0:
        user_rating_converted = (review.rating / 5) * 100
        current_total = game.total_rating * game.total_rating_count
        new_count = game.total_rating_count - 1
        
        if new_count > 0:
            new_total = current_total - user_rating_converted
            new_rating = new_total / new_count
            game.total_rating = new_rating
            game.total_rating_count = new_count
        else:
            game.total_rating = None
            game.total_rating_count = 0
    
    db.delete(review)
    db.commit()
    return None

@router.post("/{review_id}/like", response_model=dict)
async def like_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like or unlike a review."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    existing_like = db.query(ReviewLike).filter(
        and_(
            ReviewLike.user_id == current_user.id,
            ReviewLike.review_id == review_id
        )
    ).first()
    
    if existing_like:
        db.delete(existing_like)
        review.likes_count -= 1
        db.commit()
    else:
        like = ReviewLike(
            user_id=current_user.id,
            review_id=review_id
        )
        db.add(like)
        review.likes_count += 1
        db.commit()
    
    return {"message": "Review like status updated successfully"}

@router.post("/{review_id}/comments", response_model=schemas.ReviewComment)
async def add_comment(
    review_id: int,
    comment_data: schemas.ReviewCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a comment to a review."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    comment = ReviewComment(
        user_id=current_user.id,
        review_id=review_id,
        content=comment_data.content
    )
    
    db.add(comment)
    review.comments_count += 1
    db.commit()
    db.refresh(comment)
    return comment

@router.get("/{review_id}/comments", response_model=List[schemas.ReviewComment])
async def get_review_comments(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Get all comments for a review."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    comments = db.query(ReviewComment).join(User).filter(ReviewComment.review_id == review_id).all()
    return comments

@router.get("/user/game/{igdb_id}", response_model=schemas.Review)
async def get_user_review_for_game(
    igdb_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current user's review for a specific game."""
    game = db.query(Game).filter(Game.igdb_id == igdb_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    review = db.query(Review).filter(
        and_(
            Review.game_id == game.id,
            Review.user_id == current_user.id
        )
    ).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
        
    return review

@router.delete("/{review_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    review_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a comment."""
    comment = db.query(ReviewComment).filter(ReviewComment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
    
    review = db.query(Review).filter(Review.id == review_id).first()
    if review:
        review.comments_count -= 1
    
    db.delete(comment)
    db.commit()
    return None

@router.put("/{review_id}/comments/{comment_id}", response_model=schemas.ReviewComment)
async def update_comment(
    review_id: int,
    comment_id: int,
    comment_data: schemas.ReviewCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a comment."""
    comment = db.query(ReviewComment).filter(ReviewComment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )
    
    comment.content = comment_data.content
    db.commit()
    db.refresh(comment)
    return comment 