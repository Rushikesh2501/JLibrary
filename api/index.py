from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add relevant directories to python path for local dev and Vercel serverless lambda
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '..'))
be_dir = os.path.join(parent_dir, 'JLIB_BE')

for p in [current_dir, be_dir, parent_dir]:
    if p not in sys.path and os.path.exists(p):
        sys.path.insert(0, p)

try:
    from app.routers import books, users
except ImportError:
    from JLIB_BE.app.routers import books, users

app = FastAPI(
    title="JLibrary API",
    description="Backend API for JLibrary system built with FastAPI and SQLAlchemy",
    version="1.0.0"
)

# Enable CORS for frontend clients (local, LAN, and production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
