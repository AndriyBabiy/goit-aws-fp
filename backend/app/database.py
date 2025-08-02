import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# These will be set as environment variables in the EC2 instance
DATABASE_URL = os.getenv("DATABASE_URL")
# Example: "postgresql://user:password@host:port/dbname"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()