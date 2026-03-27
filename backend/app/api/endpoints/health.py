from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    """
    Health check endpoint to ensure the API is running smoothly.
    """
    return {"status": "ok", "message": "Service is healthy"}
