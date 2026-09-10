import re
from datetime import date
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


import logging

logger = logging.getLogger(__name__)


def create_book(db: Session, book_in: BookCreate, prefix: str = "JL-") -> Book:
    """
    Create a new book in the database.
    If book_id is not provided, auto-generates the next sequential ID starting with prefix (e.g. JL-1, JL-2, ...).
    If cover_url is a base64 image, uploads it to Supabase Storage under book_{book_id}/.
    """
    book_id = book_in.book_id
    if not book_id:
        book_id = get_next_book_id(db, prefix=prefix)

    native_lang = book_in.book_name_native_lang or book_in.native_title

    cover_url = book_in.cover_url
    if cover_url and (cover_url.startswith("data:image/") or cover_url.startswith("data:application/")):
        try:
            from app.core.supabase import upload_book_cover
            cover_url = upload_book_cover(book_id, cover_url)
        except Exception as e:
            logger.warning(f"Failed to upload cover for new book {book_id}: {e}")

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
        date_added=book_in.date_added or date.today(),
        date_modified=book_in.date_modified or date.today(),
        cover_url=cover_url,
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


def update_book(db: Session, book_id: str, book_update: BookUpdate) -> Book | None:
    """
    Update an existing book by its book_id.
    If cover_url is updated as base64, uploads to Supabase Storage under book_{book_id}/.
    If cover_url is placeholder or empty, deletes from Supabase Storage and sets null.
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

    # Handle cover_url updates
    if "cover_url" in update_data:
        cover_val = update_data["cover_url"]
        if cover_val and (cover_val.startswith("data:image/") or cover_val.startswith("data:application/")):
            try:
                from app.core.supabase import upload_book_cover
                update_data["cover_url"] = upload_book_cover(book_id, cover_val)
            except Exception as e:
                logger.warning(f"Failed to upload cover update for {book_id}: {e}")
        elif cover_val and ("book-placeholder" in cover_val or cover_val.strip() == ""):
            try:
                from app.core.supabase import delete_book_cover
                delete_book_cover(book_id)
            except Exception as e:
                logger.warning(f"Failed to delete cover from storage for {book_id}: {e}")
            update_data["cover_url"] = None
        elif cover_val is None:
            try:
                from app.core.supabase import delete_book_cover
                delete_book_cover(book_id)
            except Exception as e:
                logger.warning(f"Failed to delete cover from storage for {book_id}: {e}")

    for field, value in update_data.items():
        if hasattr(db_book, field):
            setattr(db_book, field, value)

    # Always update date_modified on update unless explicitly set
    if "date_modified" not in update_data:
        db_book.date_modified = date.today()

    db.commit()
    db.refresh(db_book)
    return db_book


def delete_book(db: Session, book_id: str) -> bool:
    """
    Delete a book by its book_id, including its folder/cover in Supabase Storage.
    """
    db_book = db.query(Book).filter(Book.book_id == book_id).first()
    if not db_book:
        return False

    try:
        from app.core.supabase import delete_book_cover
        delete_book_cover(book_id)
    except Exception as e:
        logger.warning(f"Failed to clean up storage cover for deleted book {book_id}: {e}")

    db.delete(db_book)
    db.commit()
    return True