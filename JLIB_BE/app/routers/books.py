from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.book import BookResponse,BookNames
from app.services import book_service

router = APIRouter(
    prefix="/books",
    tags=["Books"]
)


@router.get("/", response_model=list[BookResponse])
def get_books(db: Session = Depends(get_db)):
    """
    Get all books from the library.
    """
    return book_service.get_all_books(db)


@router.get("/name",response_model=list[BookNames])
def get_book_names(db: Session = Depends(get_db)):
    return book_service.get_book_names(db)


@router.get("/isbn/{isbn}")
def lookup_isbn(isbn: str):
    """
    Lookup book details by ISBN using Gemini LLM.
    """
    from app.services.gemini_service import lookup_book_by_isbn_gemini
    result = lookup_book_by_isbn_gemini(isbn)
    if not result:
        return {"error": "Book not found via Gemini LLM", "found": False}
    return {"found": True, "book": result}

