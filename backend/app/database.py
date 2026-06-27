from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database connection used by the FastAPI backend. Move this URL into a .env
# variable before production because it contains database credentials.
SQLALCHEMY_DATABASE_URL = "postgresql://postgres.pcapsjzbnsblpslbbwpj:Rekhapalli%404914@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

# SQLAlchemy engine/session setup. Routes receive a short-lived session through
# get_db(), then the session is closed after the request finishes.
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    # Dependency generator used by FastAPI to provide one DB session per request.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
