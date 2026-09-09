import re
from sqlalchemy.orm import Session
from app.models.book import Book
from app.schemas.book import BookCreate, BookUpdate


def get_all_books(db: Session) -> list[Book]:
    """
    Fetch all books from the books database table.
    """
    return db.query(Book).all()


def get_book_names(db: Session) -> list[Book]:
    return db.query(Book.book_id, Book.book_name).all()


def get_book_by_id(db: Session, book_id: str) -> Book | None:
    return db.query(Book).filter(Book.book_id == book_id).first()


def get_next_book_id(db: Session, prefix: str = "JL-") -> str:
    """
    Finds the highest number of added books with the given prefix (default 'JL-'),
    e.g. JL-10 -> next is JL-11. If none exist, returns JL-1.
    Supports shelf IDs (e.g. prefix='A' -> 'A-1', 'A-2', etc.).
    """
    clean_prefix = (prefix or "JL-").strip().upper()
    if not clean_prefix.endswith("-"):
        clean_prefix = f"{clean_prefix}-"

    books_with_prefix = (
        db.query(Book.book_id)
        .filter(Book.book_id.like(f"{clean_prefix}%"))
        .all()
    )

    max_num = 0
    for (bid,) in books_with_prefix:
        if bid and bid.startswith(clean_prefix):
            suffix = bid[len(clean_prefix):]
            m = re.match(r"^(\d+)", suffix)
            if m:
                try:
                    num = int(m.group(1))
                    if num > max_num:
                        max_num = num
                except ValueError:
                    pass

    return f"{clean_prefix}{max_num + 1}"


def create_book(db: Session, book_in: BookCreate, prefix: str = "JL-") -> Book:
    """
    Create a new book in the database.
    If book_id is not provided, auto-generates the next sequential ID starting with prefix (e.g. JL-1, JL-2, ...).
    """
    book_id = book_in.book_id
    if not book_id:
        book_id = get_next_book_id(db, prefix=prefix)

    native_lang = book_in.book_name_native_lang or book_in.native_title

    db_book = Book(
        book_id=book_id,
        book_name=book_in.book_name,
        book_name_native_lang=native_lang,
        author=book_in.author,
        genre=book_in.genre,
        publication=book_in.publication,
        section=book_in.section or "General",
        availability_status=book_in.availability_status or "Available",
        borrowed_by=book_in.borrowed_by,
        number_of_times_borrowed=0,
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


def update_book(db: Session, book_id: str, book_update: BookUpdate) -> Book | None:
    """
    Update an existing book by its book_id.
    """
    db_book = db.query(Book).filter(Book.book_id == book_id).first()
    if not db_book:
        return None

    update_data = book_update.model_dump(exclude_unset=True)
    # If native_title was passed instead of book_name_native_lang, map it
    if "native_title" in update_data and not update_data.get("book_name_native_lang"):
        update_data["book_name_native_lang"] = update_data.pop("native_title")
    else:
        update_data.pop("native_title", None)

    for field, value in update_data.items():
        if hasattr(db_book, field):
            setattr(db_book, field, value)

    db.commit()
    db.refresh(db_book)
    return db_book



def delete_book(db: Session, book_id: str) -> bool:
    """
    Delete a book by its book_id.
    """
    db_book = db.query(Book).filter(Book.book_id == book_id).first()
    if not db_book:
        return False
    db.delete(db_book)
    db.commit()
    return True