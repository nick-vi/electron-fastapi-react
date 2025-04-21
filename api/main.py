from fastapi import FastAPI, Request
import sys
from typing import Dict, Any
from fastapi.middleware.cors import CORSMiddleware

from logger import get_logger, log_info, log_error, log_warning

logger = get_logger("main")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app_path = "Unknown"
if len(sys.argv) > 1:
    app_path = sys.argv[1]
    log_info(f"Application path set to: {app_path}")
else:
    log_warning("No application path provided in command line arguments")

@app.get("/")
async def read_root(request: Request) -> Dict[str, Any]:
    """
    Root endpoint that returns a hello world message and the app path.

    Args:
        request: The incoming request

    Returns:
        Dict[str, Any]: A dictionary containing the message and app path
    """
    client = request.client.host if request.client else "unknown"
    log_info(f"Received request from {client}")

    response_data = {
        "message": "Hello World from FastAPI",
        "app_path": app_path,
    }

    log_info("Sending response", data=response_data)
    return response_data

@app.get("/logs")
async def get_logs() -> Dict[str, Any]:
    """
    Endpoint to test logging at different levels.

    Returns:
        Dict[str, Any]: A confirmation message
    """
    log_info("This is an info log")
    log_warning("This is a warning log")
    log_error("This is an error log")

    try:
        1 / 0
    except Exception as e:
        log_error(f"Caught an exception: {str(e)}", exc_info=True)
        
    return {
        "message": "Logs generated",
        "levels": ["info", "warning", "error"],
        "timestamp": sys.modules["datetime"].datetime.now().isoformat()
    }
