from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import json

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    try:
        body = await request.body()
        print(f"422 ERROR on {request.url}. Body: {body[:1000]}...") 
    except Exception:
        pass
    print("DETAILS:", exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})
