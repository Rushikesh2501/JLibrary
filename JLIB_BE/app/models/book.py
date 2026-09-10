from datetime import date
from sqlalchemy import Integer, Text, Date
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Book(Base):
    __tablename__ = "books"

    book_id: Mapped[str] = mapped_column(Text, primary_key=True, index=True)
    book_name: Mapped[str] = mapped_column(Text, nullable=False)
    genre: Mapped[str | None] = mapped_column(Text, nullable=True)
    author: Mapped[str] = mapped_column(Text, nullable=False)
    publication: Mapped[str | None] = mapped_column(Text, nullable=True)
    section: Mapped[str | None] = mapped_column(Text, nullable=True, default="General")
    number_of_times_borrowed: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    availability_status: Mapped[str] = mapped_column(Text, nullable=False, default="Available")
    borrowed_by: Mapped[str | None] = mapped_column(Text, nullable=True)
    book_name_native_lang: Mapped[str | None] = mapped_column(Text, nullable=True)
    date_added: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_modified: Mapped[date | None] = mapped_column(Date, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    @property
    def native_title(self) -> str | None:
        return self.book_name_native_lang




