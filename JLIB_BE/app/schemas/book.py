from pydantic import BaseModel, ConfigDict


class BookResponse(BaseModel):
    book_id: str
    book_name: str
    genre: str | None = None
    author: str
    publication: str | None = None
    section: str | None = None
    availability_status : str 
    borrowed_by: str | None = None

    model_config = ConfigDict(from_attributes=True)

class BookNames(BaseModel):
    book_id: str
    book_name: str

    model_config = ConfigDict(from_attributes=True)
