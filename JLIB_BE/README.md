# JLibrary Backend (FastAPI + SQLAlchemy + Supabase PostgreSQL)

A clean, modular Python FastAPI backend for managing the **JLibrary** system.

---

## Folder & Architecture Overview

```text
jlibrary-backend/
│
├── app/
│   ├── __init__.py          # Marks 'app' as a Python package
│   ├── main.py              # Application entry point: initializes FastAPI, CORS, health routes, mounts routers
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Reads environment configuration from .env using Pydantic Settings
│   │   └── database.py      # SQLAlchemy Engine setup, SessionLocal factory, and get_db dependency
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── book.py          # SQLAlchemy ORM model mapping python objects to the DB `books` table
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── book.py          # Pydantic schemas defining output/input JSON formats for validation & serialization
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   └── books.py         # API route handlers (endpoints) matching URL paths to business logic
│   │
│   └── services/
│       ├── __init__.py
│       └── book_service.py  # Pure database / business logic layer interacting with SQLAlchemy models
│
├── .env                     # Environment secret variables (DATABASE_URL)
├── .gitignore               # Files excluded from git
├── requirements.txt         # Project dependencies
└── README.md                # Documentation & instructions
```

---

## 1. What Each Folder Does

- **`app/core/`**: Central configuration of the system. Manages application settings (`config.py`) and database initialization/connection session pool (`database.py`).
- **`app/models/`**: Holds database representations (SQLAlchemy models). These map directly to database tables and columns.
- **`app/schemas/`**: Holds data validation & serialization structures (Pydantic models). These define what data FastAPI receives or returns in JSON HTTP responses.
- **`app/routers/`**: Handles web API routing & HTTP layer logic. Receives HTTP requests, validates path/query parameters, calls services, and returns HTTP responses.
- **`app/services/`**: Contains core database logic. Separating logic here ensures database queries remain reusable and cleanly decoupled from HTTP handling.

---

## 2. How the Supabase Connection Works

1. **`DATABASE_URL`**: Defined in `.env` using standard connection URI format:
   ```env
   DATABASE_URL=postgresql+psycopg://USERNAME:PASSWORD@HOST:PORT/DATABASE
   ```
2. **`config.py`**: Loads `DATABASE_URL` safely without hardcoding credentials in code.
3. **`database.py`**:
   - `create_engine()` creates a persistent connection pool using `psycopg3`.
   - `SessionLocal()` provides database sessions on demand.
   - `get_db()` is a FastAPI dependency generator function (`yield db`). Every incoming HTTP request receives a dedicated DB session, and when the request finishes, `get_db()` ensures `db.close()` is called automatically to free database connection slots.

---

## 3. How `GET /books/` Request Works (Request Flow)

```text
[ Client / Frontend ]
        │
        ▼  1. Send HTTP GET /books/
[ app/main.py ]  (CORS check passed, routed to books router)
        │
        ▼  2. Router matched
[ app/routers/books.py -> get_books() ]
        │
        ├── Uses Depends(get_db) -> Opens DB session via app/core/database.py
        │
        ▼  3. Delegates DB execution
[ app/services/book_service.py -> get_all_books(db) ]
        │
        ▼  4. SQLAlchemy ORM query executes
[ app/models/book.py -> Book ]
        │
        ▼  5. Queries PostgreSQL Table `books`
[ Supabase PostgreSQL Database ]
        │
        ▼  6. Raw DB rows returned
[ SQLAlchemy converts rows to list of Book instances ]
        │
        ▼  7. Pydantic validates and serializes to JSON using BookResponse
[ app/schemas/book.py -> BookResponse ]
        │
        ▼  8. JSON Array returned to Client
[ Response: 200 OK JSON ]
```

---

## 4. How to Run the Project

### Prerequisites
- Python 3.11+
- Virtual environment (`venv`)

### Step-by-Step Setup

1. **Create and Activate Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Update your `.env` file with your actual Supabase database connection string:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres.xxxx:your_password@aws-0-region.pooler.supabase.com:6543/postgres
   ```

4. **Start Development Server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will start at `http://127.0.0.1:8000`.

---

## 5. How to Open FastAPI Swagger Documentation

FastAPI generates interactive documentation automatically!

1. Open your browser and navigate to:
   [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (Swagger UI)
2. Alternative reDoc documentation is available at:
   [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

You can test `GET /`, `GET /health`, and `GET /books/` interactively directly from the Swagger UI.

---

## 6. How to Use `GET /books/` as a Pattern for Remaining APIs

When you are ready to add new APIs (e.g. `GET /books/{book_id}`, `POST /books/`, `PUT /books/{book_id}`, `DELETE /books/{book_id}`):

### Step 1: Add Pydantic Schemas (`app/schemas/book.py`)
Define request payloads or updated response shapes:
```python
class BookCreate(BaseModel):
    book_name: str
    genre: str | None = None
    author: str
    publication: str | None = None
    section: str | None = None
```

### Step 2: Add Service Functions (`app/services/book_service.py`)
Write database logic function:
```python
def create_book(db: Session, book_data: BookCreate) -> Book:
    new_book = Book(**book_data.model_dump())
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book
```

### Step 3: Add Router Endpoint (`app/routers/books.py`)
Map HTTP route to the service logic:
```python
@router.post("/", response_model=BookResponse, status_code=21)
def create_new_book(book_in: BookCreate, db: Session = Depends(get_db)):
    return book_service.create_book(db, book_in)
```
