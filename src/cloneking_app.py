import sys
import asyncio
import threading
from typing import Optional, Dict, Any
from pathlib import Path

from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont

from .utils.logger import logger
from .utils.config import config
from .core.persona import PersonaManager, PersonaConfig
from .core.training_pipeline import MultimodalTrainingPipeline, TrainingProgress
from .discovery.intelligent_scraper import IntelligentScraper
from .discovery.ml_discovery import MLDiscoveryEngine
from .ai.chatbot import Chatbot
from .gui.qt_main_window import CloneKingMainWindow

class CloneKingApp:
    """Main CloneKing application"""
    
    def __init__(self):
        logger.info("Initializing CloneKing Application")
        
        # Core components
        self.persona_manager = PersonaManager()
        self.training_pipeline = MultimodalTrainingPipeline()
        self.intelligent_scraper = IntelligentScraper()
        self.ml_discovery = MLDiscoveryEngine(self.intelligent_scraper)
        
        # AI components (adapted from Young Ellens)
        self.chatbot: Optional[Chatbot] = None
        
        # GUI
        self.qt_app: Optional[QApplication] = None
        self.window: Optional[CloneKingMainWindow] = None
        
        # Event loop for async operations
        self.loop = None
        self.loop_thread = None
        
        # Initialize components
        self._initialize_async_loop()
        self._initialize_ai_components()
        
        logger.info("CloneKing Application initialized successfully")
    
    def _initialize_async_loop(self):
        """Initialize async event loop for background operations"""
        try:
            def run_loop():
                self.loop = asyncio.new_event_loop()
                asyncio.set_event_loop(self.loop)
                self.loop.run_forever()
            
            self.loop_thread = threading.Thread(target=run_loop, daemon=True)
            self.loop_thread.start()
            
            # Non-blocking wait for loop to be ready
            attempts = 0
            while self.loop is None and attempts < 20:
                threading.Event().wait(0.005)  # 5ms non-blocking wait
                attempts += 1
            
            logger.info("Async event loop initialized")
            
        except Exception as e:
            logger.error(f"Error initializing async loop: {e}")
    
    def _initialize_ai_components(self):
        """Initialize AI components (lazy loading for better startup performance)"""
        try:
            # Lazy initialization - create chatbot only when needed
            self.chatbot = None
            
            logger.info("AI components initialized (lazy loading)")
            
        except Exception as e:
            logger.error(f"Error initializing AI components: {e}")
    
    def _ensure_chatbot_initialized(self):
        """Ensure chatbot is initialized (lazy loading)"""
        if self.chatbot is None:
            try:
                current_persona = self.persona_manager.get_current_persona()
                if current_persona:
                    self.chatbot = self._create_chatbot_for_persona(current_persona)
                else:
                    self.chatbot = Chatbot()
                logger.info("Chatbot initialized on demand")
            except Exception as e:
                logger.error(f"Error initializing chatbot: {e}")
                self.chatbot = Chatbot()  # Fallback
    
    def _create_chatbot_for_persona(self, persona: PersonaConfig) -> Chatbot:
        """Create a chatbot instance configured for a specific persona"""
        try:
            # Create chatbot with persona-specific configuration
            chatbot = Chatbot()
            
            # Load persona-specific training data and personality context
            self._configure_chatbot_for_persona(chatbot, persona)
            
            return chatbot
            
        except Exception as e:
            logger.error(f"Error creating chatbot for persona: {e}")
            return Chatbot()  # Fallback to default
    
    def _configure_chatbot_for_persona(self, chatbot: Chatbot, persona: PersonaConfig):
        """Configure chatbot with persona-specific settings"""
        try:
            # Update OpenAI system prompt with persona characteristics
            if hasattr(chatbot, 'openai_service'):
                persona_prompt = self._generate_persona_prompt(persona)
                chatbot.openai_service.base_system_prompt = persona_prompt
                chatbot.openai_service.system_prompt = persona_prompt
            
            # Load persona-specific training data
            training_dir = Path.home() / ".cloneking" / "training" / persona.id
            if training_dir.exists():
                # Load persona model if available
                model_file = training_dir / "persona_model.json"
                if model_file.exists():
                    import json
                    with open(model_file, 'r') as f:
                        persona_model = json.load(f)
                    
                    # Configure voice characteristics
                    if persona_model.get("voice_model"):
                        self._configure_voice_for_persona(chatbot, persona_model["voice_model"])
            
            logger.info(f"Configured chatbot for persona: {persona.name}")
            
        except Exception as e:
            logger.error(f"Error configuring chatbot for persona: {e}")
    
    def _generate_persona_prompt(self, persona: PersonaConfig) -> str:
        """Generate AI system prompt from persona configuration"""
        prompt = f"""You are {persona.name}, an AI persona with the following characteristics:

Description: {persona.description}

Personality Traits:
{chr(10).join(f'- {trait}' for trait in persona.personality_traits)}

Communication Style: {persona.communication_style}

Knowledge Domains:
{chr(10).join(f'- {domain}' for domain in persona.knowledge_domains)}

Instructions:
- Always stay in character as {persona.name}
- Use the communication style described above
- Draw upon your knowledge domains when responding
- Embody the personality traits in your responses
- Be authentic and consistent with your persona

Remember: You are {persona.name}, not a generic AI assistant. Respond as this specific persona would."""
        
        return prompt
    
    def _configure_voice_for_persona(self, chatbot: Chatbot, voice_model: Dict[str, Any]):
        """Configure voice characteristics for a persona"""
        try:
            if hasattr(chatbot, 'voice_engine'):
                # Apply voice characteristics from the model
                voice_settings = {
                    "speed": voice_model.get("tempo", 1.0),
                    "emotion": "neutral"  # Could be extracted from model
                }
                chatbot.voice_engine.set_voice_settings(**voice_settings)
            
        except Exception as e:
            logger.error(f"Error configuring voice for persona: {e}")
    
    def run(self):
        """Start the CloneKing PyQt6 application"""
        try:
            logger.info("Starting CloneKing PyQt6 application...")
            
            # Create QApplication
            self.qt_app = QApplication(sys.argv)
            
            # Setup application properties
            self.qt_app.setApplicationName("CloneKing")
            self.qt_app.setApplicationVersion("1.0.0")
            self.qt_app.setOrganizationName("CloneKing")
            
            # Enable high DPI scaling
            self.qt_app.setAttribute(Qt.ApplicationAttribute.AA_EnableHighDpiScaling, True)
            self.qt_app.setAttribute(Qt.ApplicationAttribute.AA_UseHighDpiPixmaps, True)
            
            # Set application style for better Apple-like appearance
            self.qt_app.setStyle('Fusion')
            
            # Apply global stylesheet for Apple-like theme
            self.setup_global_style()
            
            # Create main window
            self.window = CloneKingMainWindow(self)
            self.window.show()
            
            # Start the event loop
            sys.exit(self.qt_app.exec())
            
        except Exception as e:
            logger.error(f"Error running PyQt6 application: {e}")
            raise
        finally:
            self.shutdown()
    
    def setup_global_style(self):
        """Setup global Apple-like styling"""
        style = """
        QApplication {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
        }
        
        QWidget {
            background-color: #FFFFFF;
            color: #1D1D1F;
        }
        
        QScrollBar:vertical {
            background-color: #F8F9FA;
            width: 12px;
            border-radius: 6px;
            margin: 0px;
            border: none;
        }
        
        QScrollBar::handle:vertical {
            background-color: #C1C1C1;
            border-radius: 6px;
            min-height: 20px;
            margin: 2px;
        }
        
        QScrollBar::handle:vertical:hover {
            background-color: #A1A1A1;
        }
        
        QScrollBar::handle:vertical:pressed {
            background-color: #818181;
        }
        
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
            height: 0px;
        }
        
        QScrollBar:horizontal {
            background-color: #F8F9FA;
            height: 12px;
            border-radius: 6px;
            margin: 0px;
            border: none;
        }
        
        QScrollBar::handle:horizontal {
            background-color: #C1C1C1;
            border-radius: 6px;
            min-width: 20px;
            margin: 2px;
        }
        
        QScrollBar::handle:horizontal:hover {
            background-color: #A1A1A1;
        }
        
        QScrollBar::handle:horizontal:pressed {
            background-color: #818181;
        }
        
        QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {
            width: 0px;
        }
        """
        
        self.qt_app.setStyleSheet(style)
    
    def shutdown(self):
        """Shutdown the application cleanly"""
        try:
            logger.info("Shutting down CloneKing application...")
            
            # Stop async loop
            if self.loop and self.loop.is_running():
                self.loop.call_soon_threadsafe(self.loop.stop)
            
            # Save configurations
            config.save()
            
            logger.info("CloneKing application shutdown complete")
            
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
    
    # Persona Management Methods
    def switch_persona(self, persona_id: str) -> bool:
        """Switch to a different persona"""
        try:
            if self.persona_manager.set_current_persona(persona_id):
                # Reconfigure AI components for new persona
                persona = self.persona_manager.get_persona(persona_id)
                if persona:
                    self.chatbot = self._create_chatbot_for_persona(persona)
                    
                    # Update GUI if available
                    if self.window:
                        self.window.on_persona_switched(persona)
                    
                    logger.info(f"Switched to persona: {persona.name}")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error switching persona: {e}")
            return False
    
    def create_persona(
        self,
        name: str,
        description: str,
        personality_traits: list,
        communication_style: str,
        knowledge_domains: list,
        source_preferences: dict = None
    ) -> Optional[PersonaConfig]:
        """Create a new persona"""
        try:
            persona = self.persona_manager.create_persona(
                name=name,
                description=description,
                personality_traits=personality_traits,
                communication_style=communication_style,
                knowledge_domains=knowledge_domains,
                source_preferences=source_preferences or {}
            )
            
            # Initialize discovery sources for the new persona
            if self.loop:
                asyncio.run_coroutine_threadsafe(
                    self._initialize_persona_discovery(persona),
                    self.loop
                )
            
            return persona
            
        except Exception as e:
            logger.error(f"Error creating persona: {e}")
            return None
    
    async def _initialize_persona_discovery(self, persona: PersonaConfig):
        """Initialize content discovery for a new persona"""
        try:
            # Discover initial sources
            discovered_sources = self.intelligent_scraper.discover_sources_for_persona(persona)
            
            # Add discovered sources
            for source_url in discovered_sources[:5]:  # Limit to top 5
                self.intelligent_scraper.add_content_source(
                    persona_id=persona.id,
                    url=source_url,
                    source_type="website",
                    keywords=persona.knowledge_domains[:3],
                    update_frequency="daily"
                )
            
            logger.info(f"Initialized discovery for persona: {persona.name}")
            
        except Exception as e:
            logger.error(f"Error initializing persona discovery: {e}")
    
    # Training Methods
    def start_persona_training(
        self,
        persona_id: str,
        training_data: Dict[str, list],
        progress_callback=None
    ):
        """Start training a persona with multimodal data"""
        try:
            if self.loop:
                future = asyncio.run_coroutine_threadsafe(
                    self.training_pipeline.train_persona(
                        persona_id,
                        training_data,
                        progress_callback
                    ),
                    self.loop
                )
                return future
            else:
                logger.error("Async loop not available for training")
                return None
                
        except Exception as e:
            logger.error(f"Error starting persona training: {e}")
            return None
    
    def get_training_progress(self, persona_id: str) -> Optional[TrainingProgress]:
        """Get training progress for a persona"""
        return self.training_pipeline.get_training_progress(persona_id)
    
    def cancel_training(self, persona_id: str) -> bool:
        """Cancel ongoing training"""
        return self.training_pipeline.cancel_training(persona_id)
    
    # Discovery Methods
    def start_content_discovery(self, persona_id: str):
        """Start content discovery for a persona"""
        try:
            if self.loop:
                future = asyncio.run_coroutine_threadsafe(
                    self.intelligent_scraper.scrape_content_for_persona(persona_id),
                    self.loop
                )
                return future
            else:
                logger.error("Async loop not available for discovery")
                return None
                
        except Exception as e:
            logger.error(f"Error starting content discovery: {e}")
            return None
    
    def generate_source_recommendations(self, persona_id: str):
        """Generate source recommendations for a persona"""
        try:
            persona = self.persona_manager.get_persona(persona_id)
            if persona and self.loop:
                future = asyncio.run_coroutine_threadsafe(
                    self.ml_discovery.generate_source_recommendations(persona),
                    self.loop
                )
                return future
            return None
                
        except Exception as e:
            logger.error(f"Error generating source recommendations: {e}")
            return None
    
    def analyze_content_patterns(self, persona_id: str):
        """Analyze content patterns for a persona"""
        try:
            if self.loop:
                future = asyncio.run_coroutine_threadsafe(
                    self.ml_discovery.analyze_persona_content_patterns(persona_id),
                    self.loop
                )
                return future
            return None
                
        except Exception as e:
            logger.error(f"Error analyzing content patterns: {e}")
            return None
    
    # Chat Methods
    def send_message(self, message: str, callback=None):
        """Send a message to the current persona"""
        try:
            self._ensure_chatbot_initialized()
            if self.chatbot:
                self.chatbot.generate_response(message, callback)
            else:
                logger.warning("No chatbot available")
                if callback:
                    callback("Sorry, no persona is currently active.")
                    
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            if callback:
                callback("An error occurred while processing your message.")
    
    # Utility Methods
    def get_current_persona(self) -> Optional[PersonaConfig]:
        """Get the currently active persona"""
        return self.persona_manager.get_current_persona()
    
    def get_all_personas(self) -> list:
        """Get all personas"""
        return self.persona_manager.list_personas()
    
    def get_persona_statistics(self, persona_id: str) -> Dict[str, Any]:
        """Get statistics for a persona"""
        stats = self.persona_manager.get_persona_statistics(persona_id)
        
        # Add discovery statistics
        discovered_content = self.intelligent_scraper.get_discovered_content(persona_id)
        stats["discovered_content_count"] = len(discovered_content)
        
        # Add training statistics
        training_progress = self.get_training_progress(persona_id)
        if training_progress:
            stats["training_status"] = training_progress.status
            stats["training_progress"] = training_progress.progress_percentage
        
        return stats