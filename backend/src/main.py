from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore

# Import routers directly from their respective modules
from src.api.v1.chats import router as chats_router
from src.api.v1.export import router as export_router
from src.api.v1.audio import router as audio_router

app = FastAPI(
    title="Memories API",
    description="API for the Memories application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chats_router, prefix="/api/v1")
app.include_router(export_router, prefix="/api/v1")
app.include_router(audio_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to Memories API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}