import sys
import os

# Add paths so app modules import cleanly whether run locally or on Vercel
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '..'))
be_dir = os.path.join(parent_dir, 'JLIB_BE')

for p in [current_dir, be_dir, parent_dir]:
    if p not in sys.path and os.path.exists(p):
        sys.path.insert(0, p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import books, users

app = FastAPI(
    title="JLibrary API",
    description="Backend API for JLibrary system built with FastAPI and SQLAlchemy",
    version="1.0.0"
)

# Enable CORS for local dev, LAN IP, and production Vercel
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.0.140:3000",
    "http://192.168.0.140:5173",
    "https://j-library-brown.vercel.app"
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
