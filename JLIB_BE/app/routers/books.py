from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.book import BookResponse, BookNames, BookCreate, BookUpdate, BookIdResponse
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


@router.get("/next-id", response_model=BookIdResponse)
def get_next_book_id(
    prefix: str = Query("JL-", description="Prefix for book ID, e.g. JL- or shelf ID like A1-"),
    db: Session = Depends(get_db)
):
    """
    Get the next available sequential book ID starting with prefix (e.g. JL-1, JL-2, ..., JL-11).
    Checks existing books to determine the latest number.
    Later, this supports shelf IDs (e.g. A1-).
    """
    next_id = book_service.get_next_book_id(db, prefix=prefix)
    return {"next_book_id": next_id}


@router.get("/name", response_model=list[BookNames])
def get_book_names(db: Session = Depends(get_db)):
    return book_service.get_book_names(db)


@router.get("/isbn/{isbn}")
def lookup_isbn(isbn: str):
    """
    Lookup book details by ISBN using Open Library first, falling back to Gemini LLM.
    """
    from app.services.openlibrary_service import lookup_book_by_isbn_openlibrary
    openlib_result = lookup_book_by_isbn_openlibrary(isbn)
    if openlib_result:
        return {"found": True, "source": "openlibrary", "book": openlib_result}

    from app.services.gemini_service import lookup_book_by_isbn_gemini
    gemini_result = lookup_book_by_isbn_gemini(isbn)
    if gemini_result:
        return {"found": True, "source": "gemini", "book": gemini_result}

    return {"error": "Book not found via OpenLibrary or Gemini LLM", "found": False}


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


@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def add_book(
    book_in: BookCreate,
    prefix: str = Query("JL-", description="Prefix for auto-generated book ID if not provided"),
    db: Session = Depends(get_db)
):
    """
    Add a new book to the library collection.
    If book_id is not provided, automatically assigns the next sequential ID starting with prefix (e.g. JL-1, JL-2, ..., JL-11).
    """
    return book_service.create_book(db, book_in=book_in, prefix=prefix)


@router.get("/{book_id}", response_model=BookResponse)
def get_book_by_id(book_id: str, db: Session = Depends(get_db)):
    """
    Get a single book by its book_id.
    """
    book = book_service.get_book_by_id(db, book_id=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.put("/{book_id}", response_model=BookResponse)
def update_book(book_id: str, book_update: BookUpdate, db: Session = Depends(get_db)):
    """
    Update details for an existing book in the collection.
    """
    updated_book = book_service.update_book(db, book_id=book_id, book_update=book_update)
    if not updated_book:
        raise HTTPException(status_code=404, detail="Book not found")
    return updated_book


@router.post("/{book_id}/cover")
async def upload_cover(
    book_id: str,
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Upload a cover photo for a book to Supabase Storage in folder book_{book_id}/.
    """
    book = book_service.get_book_by_id(db, book_id=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if not file:
        raise HTTPException(status_code=400, detail="No image file provided")

    contents = await file.read()
    content_type = file.content_type or "image/jpeg"
    from app.core.supabase import upload_book_cover
    public_url = upload_book_cover(book_id, contents, content_type=content_type)

    book_service.update_book(db, book_id=book_id, book_update=BookUpdate(cover_url=public_url))
    return {"cover_url": public_url, "message": "Cover uploaded successfully"}


@router.delete("/{book_id}/cover")
def remove_cover(
    book_id: str,
    db: Session = Depends(get_db)
):
    """
    Remove cover photo for a book from Supabase Storage.
    """
    book = book_service.get_book_by_id(db, book_id=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    from app.core.supabase import delete_book_cover
    delete_book_cover(book_id)
    book_service.update_book(db, book_id=book_id, book_update=BookUpdate(cover_url=""))
    return {"message": "Cover removed successfully"}


@router.delete("/delete-book/{book_id}")
@router.delete("/{book_id}", include_in_schema=False)
def delete_book(book_id: str, db: Session = Depends(get_db)):
    """
    Delete a book from the library collection by its book_id.
    """
    success = book_service.delete_book(db, book_id=book_id)
    if not success:
        raise HTTPException(status_code=404, detail="Book not found")
    return {"message": f"Book '{book_id}' deleted successfully", "success": True}





