from sqlalchemy import BigInteger, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Book(Base):
    __tablename__ = "books"

    book_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    book_name: Mapped[str] = mapped_column(Text, nullable=False)
    genre: Mapped[str | None] = mapped_column(Text, nullable=True)
    author: Mapped[str] = mapped_column(Text, nullable=False)
    publication: Mapped[str | None] = mapped_column(Text, nullable=True)
    section: Mapped[str | None] = mapped_column(Text, nullable=True)
    availability_status : Mapped[str] = mapped_column(Text, nullable=False)
    borrowed_by: Mapped[str | None] = mapped_column(Text, nullable=True)

