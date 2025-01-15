"""
Database configuration and session management.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine
from sqlite3 import Connection as SQLite3Connection
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Enable SQLite foreign key support
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, SQLite3Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Create database engine
# Ensure data directory exists
data_dir = "/data"
if not os.path.exists(data_dir):
    os.makedirs(data_dir, exist_ok=True)

engine = create_engine(
    os.getenv("DATABASE_URL", "sqlite:///:memory:"),
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=True  # Enable SQL logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Import Base from base module
from .base import Base

# Create all tables
def init_db():
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
