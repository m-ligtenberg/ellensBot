import customtkinter as ctk
import threading
import sys
import os
import traceback
from typing import Optional
from .gui.main_window import MainWindow
from .database.db_manager import DatabaseManager
from .ai.chatbot import Chatbot
from .utils.logger import logger
from .utils.config import config

ctk.set_appearance_mode(config.get("appearance.theme", "dark"))
ctk.set_default_color_theme("blue")

class YoungEllensApp:
    def __init__(self):
        self.root: Optional[ctk.CTk] = None
        self.main_window: Optional[MainWindow] = None
        self.db_manager: Optional[DatabaseManager] = None
        self.chatbot: Optional[Chatbot] = None
        self.is_running = False
        
        logger.info("Initializing Young Ellens Desktop Application")
        
    def run(self):
        """Run the main application"""
        try:
            logger.info("Starting application...")
            self.is_running = True
            
            # Initialize components
            self._initialize_components()
            
            # Create main window
            self.root = ctk.CTk()
            self._configure_window()
            
            # Create main interface
            self.main_window = MainWindow(
                root=self.root,
                db_manager=self.db_manager,
                chatbot=self.chatbot
            )
            
            # Setup shutdown handler
            self.root.protocol("WM_DELETE_WINDOW", self._on_closing)
            
            # Set up global exception handler
            self.root.report_callback_exception = self._handle_exception
            
            logger.info("Application started successfully")
            
            # Start main loop
            self.root.mainloop()
            
        except Exception as e:
            logger.error(f"Critical application error: {e}")
            logger.error(traceback.format_exc())
            self._emergency_shutdown()
            sys.exit(1)
    
    def _initialize_components(self):
        """Initialize application components"""
        try:
            logger.info("Initializing database...")
            self.db_manager = DatabaseManager()
            
            logger.info("Initializing chatbot...")
            self.chatbot = Chatbot()
            
            logger.info("Components initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing components: {e}")
            raise
    
    def _configure_window(self):
        """Configure the main window"""
        try:
            window_width = config.get("appearance.window_width", 1200)
            window_height = config.get("appearance.window_height", 800)
            
            self.root.title("Young Ellens - AI Chatbot")
            self.root.geometry(f"{window_width}x{window_height}")
            self.root.minsize(800, 600)
            
            # Center window on screen
            self.root.after(100, self._center_window)
            
            # Try to set icon
            self._set_window_icon()
            
        except Exception as e:
            logger.warning(f"Error configuring window: {e}")
    
    def _center_window(self):
        """Center the window on screen"""
        try:
            self.root.update_idletasks()
            width = self.root.winfo_width()
            height = self.root.winfo_height()
            x = (self.root.winfo_screenwidth() // 2) - (width // 2)
            y = (self.root.winfo_screenheight() // 2) - (height // 2)
            self.root.geometry(f"{width}x{height}+{x}+{y}")
        except Exception as e:
            logger.warning(f"Error centering window: {e}")
    
    def _set_window_icon(self):
        """Set window icon if available"""
        try:
            icon_paths = [
                "assets/icon.ico",
                "assets/icon.png",
                "icon.ico",
                "icon.png"
            ]
            
            for icon_path in icon_paths:
                if os.path.exists(icon_path):
                    if icon_path.endswith('.ico'):
                        self.root.iconbitmap(icon_path)
                    else:
                        # For PNG files, would need PIL conversion
                        pass
                    logger.info(f"Icon set: {icon_path}")
                    return
                    
        except Exception as e:
            logger.warning(f"Could not set window icon: {e}")
    
    def _handle_exception(self, exc_type, exc_value, exc_traceback):
        """Handle uncaught exceptions"""
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        
        error_msg = "".join(traceback.format_exception(exc_type, exc_value, exc_traceback))
        logger.error(f"Uncaught exception: {error_msg}")
        
        # Show error dialog if GUI is available
        if self.root and self.root.winfo_exists():
            try:
                import tkinter.messagebox as msgbox
                msgbox.showerror(
                    "Application Error",
                    f"An unexpected error occurred:\n\n{exc_value}\n\nCheck logs for details."
                )
            except:
                pass
    
    def _on_closing(self):
        """Handle application closing"""
        logger.info("Application shutdown requested")
        self._shutdown()
    
    def _shutdown(self):
        """Graceful application shutdown"""
        try:
            self.is_running = False
            
            logger.info("Shutting down application...")
            
            # Save current window state
            if self.root and self.root.winfo_exists():
                try:
                    config.set("appearance.window_width", self.root.winfo_width())
                    config.set("appearance.window_height", self.root.winfo_height())
                except:
                    pass
            
            # Close database connection
            if self.db_manager:
                logger.info("Closing database connection...")
                self.db_manager.close()
            
            # Destroy GUI
            if self.root:
                self.root.quit()
                self.root.destroy()
            
            logger.info("Application shutdown complete")
            
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
        finally:
            sys.exit(0)
    
    def _emergency_shutdown(self):
        """Emergency shutdown for critical errors"""
        try:
            if self.db_manager:
                self.db_manager.close()
            if self.root:
                self.root.destroy()
        except:
            pass