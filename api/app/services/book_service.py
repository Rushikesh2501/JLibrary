from sqlalchemy.orm import Session
from app.models.book import Book


def get_all_books(db: Session) -> list[Book]:
    """
    Fetch all books from the books database table.
    """
    return db.query(Book).all()

def get_book_names(db: Session) -> list[Book]:
    return db.query(Book.book_id, Book.book_name).all()