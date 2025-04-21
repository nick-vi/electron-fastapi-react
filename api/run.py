from pathlib import Path
import sys

import uvicorn

# Import our custom logger
from logger import get_logger, log_error, log_info, log_warning


# Create a logger for this module
logger = get_logger("runner")


def start_server(port: int = 8000, app_args: list[str] | None = None) -> None:
    """
    Start the FastAPI server with the given port and arguments.

    Args:
        port: The port to run the server on
        app_args: Additional arguments to pass to the FastAPI application
    """
    log_info(f"Starting FastAPI server on port {port}")
    if app_args:
        log_info(f"With arguments: {app_args}")

    try:
        # Get the current working directory
        cwd = Path.cwd()
        log_info(f"Current working directory: {cwd}")

        # Start the uvicorn server
        uvicorn.run(
            "main:app", host="127.0.0.1", port=port, reload=False, log_level="info"
        )
    except Exception as e:
        log_error(f"Failed to start server: {str(e)}", exc_info=True)


if __name__ == "__main__":
    # Get the port from command line arguments or use default
    port = 8000
    app_path = "Unknown"

    # Check if we have command line arguments
    if len(sys.argv) > 1:
        app_path = sys.argv[1]
        log_info(f"Received app_path: {app_path}")
    else:
        log_warning("No app_path provided, using default value")

    # Log system information
    log_info(f"Python version: {sys.version}")
    log_info(f"Platform: {sys.platform}")

    # Start the server
    log_info("Starting FastAPI server")
    start_server(port=port, app_args=[app_path])
