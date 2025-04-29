import argparse
import logging
import sys

import uvicorn

from logger import get_logger, log_debug, log_error, log_info


logger = get_logger("runner")


def configure_uvicorn_logging():
    """
    Configure Uvicorn logging to use our custom formatter.
    This ensures Uvicorn logs are properly tagged and formatted.
    """
    from logger import JSONFormatter

    uvicorn_handler = logging.StreamHandler(sys.stdout)
    uvicorn_handler.setFormatter(JSONFormatter())

    root_logger = logging.getLogger()
    root_logger.handlers = []

    uvicorn_loggers = [
        logging.getLogger("uvicorn"),
        logging.getLogger("uvicorn.access"),
        logging.getLogger("uvicorn.error"),
    ]

    for uvicorn_logger in uvicorn_loggers:
        uvicorn_logger.setLevel(logging.INFO)

        for handler in uvicorn_logger.handlers[:]:
            uvicorn_logger.removeHandler(handler)

        uvicorn_logger.addHandler(uvicorn_handler)

        uvicorn_logger.propagate = False

    for logger_name in ["watchfiles", "uvicorn.reload", "uvicorn.access"]:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.WARNING)


def start_server(port: int, reload: bool = False, log_level: str = "info") -> None:
    """
    Start the FastAPI server with the given port and arguments.

    Args:
        port: The port to run the server on
        reload: Whether to enable auto-reload
        log_level: Log level for uvicorn
    """

    try:
        configure_uvicorn_logging()

        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=port,
            reload=reload,
            log_level=log_level,
            access_log=False,
            log_config=None,
        )
    except Exception as e:
        log_error(f"Failed to start server: {str(e)}", exc_info=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Start the FastAPI server")
    parser.add_argument("--app-path", default="Unknown", help="Path to the application")
    parser.add_argument(
        "--port", type=int, required=True, help="Port to run the server on"
    )
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    parser.add_argument(
        "--log-level",
        default="info",
        choices=["debug", "info", "warning", "error"],
        help="Log level",
    )
    args = parser.parse_args()

    app_path = args.app_path
    port = args.port
    reload = args.reload
    log_level = args.log_level

    log_debug(
        f"Starting FastAPI server with port={port}, reload={reload}, log_level={log_level}"
    )
    log_info("FastAPI server starting")
    start_server(port=port, reload=reload, log_level=log_level)
