from datetime import date
from pydantic import BaseModel, ConfigDict


class BookResponse(BaseModel):
    book_id: str
    book_name: str
    book_name_native_lang: str | None = None
    native_title: str | None = None
    genre: str | None = None

    author: str
    publication: str | None = None
    section: str | None = None
    availability_status: str
    borrowed_by: str | None = None
    number_of_times_borrowed: int | None = 0
    date_added: date | None = None
    date_modified: date | None = None
    cover_url: str | None = None
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class BookNames(BaseModel):
    book_id: str
    book_name: str

    model_config = ConfigDict(from_attributes=True)


class BookCreate(BaseModel):
    book_name: str
    author: str
    book_name_native_lang: str | None = None
    native_title: str | None = None
    genre: str | None = None
    publication: str | None = None
    section: str | None = "General"
    availability_status: str = "Available"
    borrowed_by: str | None = None
    book_id: str | None = None  # If not provided, will be auto-generated with prefix (e.g. JL-1, JL-2, ...)
    date_added: date | None = None
    date_modified: date | None = None
    cover_url: str | None = None
    description: str | None = None


class BookUpdate(BaseModel):
    book_name: str | None = None
    book_name_native_lang: str | None = None
    native_title: str | None = None
    author: str | None = None
    genre: str | None = None
    publication: str | None = None
    section: str | None = None
    availability_status: str | None = None
    borrowed_by: str | None = None
    book_id: str | None = None
    date_added: date | None = None
    date_modified: date | None = None
    cover_url: str | None = None
    description: str | None = None



class BookIdResponse(BaseModel):
    next_book_id: str

