from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add JLIB_BE to python path so app modules import cleanly
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'JLIB_BE'))

from app.routers import books, users

app = FastAPI(
    title="JLibrary API",
    description="Backend API for JLibrary system built with FastAPI and SQLAlchemy",
    version="1.0.0"
)

# Enable CORS
origins = [
    "*"
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


@app.get("/")
def read_root():
    return {"message": "JLibrary API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
