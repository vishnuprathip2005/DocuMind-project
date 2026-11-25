import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.session import init_db
from app.services.file_storage import get_storage_path
from app.routers import documents, chat

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("document_ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure storage folder and database tables exist
    logger.info("Initializing Document Management & AI Assistant...")
    get_storage_path()
    try:
        init_db()
        logger.info("Database and storage directory initialized.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
    yield
    # Shutdown logic if any
    logger.info("Application shutting down.")


app = FastAPI(
    title="Document Management & AI Assistant API",
    version="1.0.0",
    description="Full-stack Document Management and grounded AI Question-Answering system.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/api/health", tags=["Health"], summary="Service Health Check")
def health_check():
    return {
        "status": "ok",
        "service": "document-ai-assistant",
        "provider": settings.AI_PROVIDER,
        "maxUploadSizeMb": settings.MAX_UPLOAD_SIZE_MB
    }


# Exception handler to avoid exposing raw stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact support or try again later."}
    )
