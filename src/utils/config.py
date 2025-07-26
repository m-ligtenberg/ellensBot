import json
import os
from pathlib import Path
from typing import Dict, Any
from .logger import logger

class Config:
    """Application configuration manager"""
    
    def __init__(self):
        self.config_dir = Path.home() / ".youngellens"
        self.config_file = self.config_dir / "config.json"
        self.default_config = {
            "appearance": {
                "theme": "dark",
                "font_size": 14,
                "window_width": 1200,
                "window_height": 800,
                "sidebar_width": 280
            },
            "chat": {
                "max_message_length": 1000,
                "auto_save": True,
                "show_timestamps": True,
                "typing_delay_min": 0.8,
                "typing_delay_max": 2.5
            },
            "database": {
                "db_name": "young_ellens.db",
                "backup_enabled": True,
                "max_messages_per_session": 1000
            },
            "ai": {
                "personality_mode": "street",
                "response_variation": True,
                "mood_changes": True
            },
            "advanced": {
                "debug_mode": False,
                "log_level": "INFO",
                "auto_update_check": True
            }
        }
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from file"""
        try:
            self.config_dir.mkdir(exist_ok=True)
            
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)
                
                # Merge with defaults to ensure all keys exist
                config = self.default_config.copy()
                self._deep_update(config, loaded_config)
                logger.info("Configuration loaded successfully")
                return config
            else:
                logger.info("No config file found, using defaults")
                self.save_config(self.default_config)
                return self.default_config.copy()
                
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return self.default_config.copy()
    
    def save_config(self, config: Dict[str, Any] = None):
        """Save configuration to file"""
        try:
            config_to_save = config or self.config
            self.config_dir.mkdir(exist_ok=True)
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config_to_save, f, indent=2, ensure_ascii=False)
            
            logger.info("Configuration saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving config: {e}")
    
    def save(self):
        """Alias for save_config()"""
        self.save_config()
    
    def get(self, key: str, default=None):
        """Get configuration value using dot notation (e.g., 'appearance.theme')"""
        try:
            keys = key.split('.')
            value = self.config
            
            for k in keys:
                value = value[k]
            
            return value
            
        except (KeyError, TypeError):
            logger.warning(f"Config key '{key}' not found, using default: {default}")
            return default
    
    def set(self, key: str, value: Any):
        """Set configuration value using dot notation"""
        try:
            keys = key.split('.')
            config = self.config
            
            # Navigate to the parent of the target key
            for k in keys[:-1]:
                if k not in config:
                    config[k] = {}
                config = config[k]
            
            # Set the value
            config[keys[-1]] = value
            self.save_config()
            logger.info(f"Config updated: {key} = {value}")
            
        except Exception as e:
            logger.error(f"Error setting config '{key}': {e}")
    
    def _deep_update(self, base_dict: dict, update_dict: dict):
        """Recursively update nested dictionaries"""
        for key, value in update_dict.items():
            if key in base_dict and isinstance(base_dict[key], dict) and isinstance(value, dict):
                self._deep_update(base_dict[key], value)
            else:
                base_dict[key] = value
    
    def reset_to_defaults(self):
        """Reset configuration to default values"""
        self.config = self.default_config.copy()
        self.save_config()
        logger.info("Configuration reset to defaults")

# Global config instance
config = Config()