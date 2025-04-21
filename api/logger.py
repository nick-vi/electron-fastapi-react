"""
Logger module for the FastAPI application.
This module provides a standardized way to log messages that can be captured by the Electron main process.
"""

import datetime
import json
import logging
import sys
from typing import Any


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


class JSONFormatter(logging.Formatter):
    """
    Custom formatter that outputs log records as JSON for easy parsing by the Electron main process.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.datetime.now().isoformat(),
            "level": record.levelname,
            "source": "python",
            "name": record.name,
            "message": record.getMessage(),
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        for key, value in record.__dict__.items():
            if key not in [
                "args",
                "asctime",
                "created",
                "exc_info",
                "exc_text",
                "filename",
                "funcName",
                "id",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "message",
                "msg",
                "name",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "stack_info",
                "thread",
                "threadName",
            ]:
                log_data[key] = value

        return f"ELECTRON_LOG_JSON:{json.dumps(log_data)}"


stdout_handler = logging.StreamHandler(sys.stdout)
stdout_handler.setFormatter(JSONFormatter())


logger = logging.getLogger("api")
logger.setLevel(logging.INFO)


for handler in logger.handlers[:]:
    logger.removeHandler(handler)
logger.addHandler(stdout_handler)


def get_logger(name: str | None = None) -> logging.Logger:
    """
    Get a logger with the given name.

    Args:
        name: The name of the logger. If None, returns the root logger.

    Returns:
        A logger instance with the JSON formatter.
    """
    child_logger = logger.getChild(name) if name else logger

    return child_logger


def log_info(message: str, **kwargs: Any) -> None:
    """
    Log an info message.

    Args:
        message: The message to log.
        **kwargs: Additional key-value pairs to include in the log.
    """
    logger.info(message, extra=kwargs)


def log_error(message: str, exc_info: bool = False, **kwargs: Any) -> None:
    """
    Log an error message.

    Args:
        message: The message to log.
        exc_info: Whether to include exception information.
        **kwargs: Additional key-value pairs to include in the log.
    """
    logger.error(message, exc_info=exc_info, extra=kwargs)


def log_warning(message: str, **kwargs: Any) -> None:
    """
    Log a warning message.

    Args:
        message: The message to log.
        **kwargs: Additional key-value pairs to include in the log.
    """
    logger.warning(message, extra=kwargs)


def log_debug(message: str, **kwargs: Any) -> None:
    """
    Log a debug message.

    Args:
        message: The message to log.
        **kwargs: Additional key-value pairs to include in the log.
    """
    logger.debug(message, extra=kwargs)
