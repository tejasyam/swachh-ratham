from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, SessionLocal, engine
from .routers import admin_routes, auth_routes, driver_routes, object_routes, pickup_routes, user_routes
from .services import migrate_object_columns, migrate_pickup_columns, migrate_user_columns, seed_database

# FastAPI application entry point. Routers below split the API by domain.
app = FastAPI(title="Swachh Ratham API", version="1.0.0")

# CORS is open for prototype development so Expo/web clients can call the API
# from local devices. Lock this down to trusted origins before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(object_routes.router)
app.include_router(user_routes.router)
app.include_router(pickup_routes.router)
app.include_router(driver_routes.router)
app.include_router(admin_routes.router)


@app.on_event("startup")
def on_startup():
    # Create missing tables, apply simple column migrations, then seed demo users.
    Base.metadata.create_all(bind=engine)
    migrate_user_columns()
    migrate_object_columns()
    migrate_pickup_columns()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Swachh Ratham API is running"}
