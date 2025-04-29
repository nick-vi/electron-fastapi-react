import argparse
import sys
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from logger import get_logger, log_error, log_info, log_warning


logger = get_logger("main")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


parser = argparse.ArgumentParser()
parser.add_argument("--app-path", help="Path to the Electron app")
args, _ = parser.parse_known_args()

app_path = args.app_path or "Unknown"
# Only log a warning if the app path is missing, otherwise it's expected
if app_path == "Unknown":
    log_warning("No application path provided in command-line arguments")


@app.get("/")
async def read_root() -> dict[str, Any]:
    """
    Root endpoint that returns a hello world message and the app path.

    Returns:
        Dict[str, Any]: A dictionary containing the message and app path
    """
    response_data = {
        "message": "Hello World from FastAPI",
        "app_path": app_path,
    }
    return response_data


@app.get("/health")
async def health_check() -> dict[str, str]:
    """
    Health check endpoint to verify the API is running.

    Returns:
        Dict[str, str]: A status message
    """
    return {"status": "ok"}


@app.get("/logs")
async def get_logs() -> dict[str, Any]:
    """
    Endpoint to test logging at different levels.

    Returns:
        Dict[str, Any]: A confirmation message
    """
    log_info("This is an info log")
    log_warning("This is a warning log")
    log_error("This is an error log")

    try:
        result = 1 / 0
        log_info(f"Result: {result}")
    except Exception as e:
        log_error(f"Caught an exception: {str(e)}", exc_info=True)

    return {
        "message": "Logs generated",
        "levels": ["info", "warning", "error"],
        "timestamp": sys.modules["datetime"].datetime.now().isoformat(),
    }
