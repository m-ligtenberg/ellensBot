import logging
import os
from datetime import datetime
from pathlib import Path

class Logger:
    _instance = None
    _logger = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._setup_logger()
        return cls._instance
    
    def _setup_logger(self):
        """Setup application logger"""
        # Create logs directory
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        # Setup logger
        self._logger = logging.getLogger("YoungEllens")
        self._logger.setLevel(logging.DEBUG)
        
        # Avoid duplicate handlers
        if self._logger.handlers:
            return
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_format = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%H:%M:%S'
        )
        console_handler.setFormatter(console_format)
        
        # File handler
        log_file = log_dir / f"youngellens_{datetime.now().strftime('%Y%m%d')}.log"
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        file_format = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
        )
        file_handler.setFormatter(file_format)
        
        # Add handlers
        self._logger.addHandler(console_handler)
        self._logger.addHandler(file_handler)
        
        self._logger.info("Logger initialized")
    
    def get_logger(self):
        """Get the logger instance"""
        return self._logger

# Global logger instance
logger = Logger().get_logger()