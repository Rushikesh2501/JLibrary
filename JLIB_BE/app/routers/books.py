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


from fastapi import File, UploadFile
from typing import Optional

@router.post("/photo")
async def lookup_photo(
    front_cover: Optional[UploadFile] = File(None),
    back_cover: Optional[UploadFile] = File(None)
):
    """
    Extract book details from front and/or back cover images using Gemini Vision LLM.
    Supports JPG, PNG, WEBP, and HEIC/HEIF images.
    """
    from app.services.gemini_service import lookup_book_by_photo_gemini

    front_bytes = await front_cover.read() if front_cover else None
    front_mime = front_cover.content_type if front_cover and front_cover.content_type else "image/jpeg"

    back_bytes = await back_cover.read() if back_cover else None
    back_mime = back_cover.content_type if back_cover and back_cover.content_type else "image/jpeg"

    result = lookup_book_by_photo_gemini(
        front_bytes=front_bytes,
        front_mime=front_mime,
        back_bytes=back_bytes,
        back_mime=back_mime
    )

    if not result:
        return {"error": "Could not extract book details from the uploaded photo(s)", "found": False}
    return {"found": True, "book": result}

