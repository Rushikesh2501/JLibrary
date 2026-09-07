from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import books, users

app = FastAPI(
    title="JLibrary API",
    description="Backend API for JLibrary system built with FastAPI and SQLAlchemy",
    version="1.0.0"
)

# Enable CORS for local frontend development
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*"  # Allow all origins during initial development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(books.router)
app.include_router(users.router)


# Health / Root Endpoints
@app.get("/")
def read_root():
    return {"message": "JLibrary API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
