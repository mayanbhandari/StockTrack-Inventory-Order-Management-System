from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.config import settings
from app.database import Base, engine
from app.routers import customers, dashboard, orders, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables automatically for this small assessment app.
    Base.metadata.create_all(bind=engine)
    yield


# Main FastAPI application metadata shown in Swagger docs.
app = FastAPI(
    title="StockTrack Inventory API",
    description="Inventory and order management for small businesses",
    version="1.0.0",
    lifespan=lifespan,
)

# Split comma-separated CORS origins from the environment.
allowed_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

# Allow the deployed frontend to call this API safely.
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError):
    # Return field-level validation messages that the frontend can show clearly.
    errors = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err["loc"] if loc != "body")
        errors.append({"field": field, "message": err["msg"]})
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation failed", "errors": errors},
    )


@app.exception_handler(ValidationError)
async def handle_pydantic_error(request: Request, exc: ValidationError):
    # Catch schema validation issues outside the normal request body path.
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation failed", "errors": exc.errors()},
    )


# Register feature routers in one place.
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


@app.get("/health")
def health_check():
    # Hosting platforms use this endpoint to confirm the API is alive.
    return {"status": "ok", "service": "stocktrack-api"}
