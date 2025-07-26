import random
import time
import threading
import re
import asyncio
from typing import Callable, Optional, List
from ..utils.logger import logger
from ..utils.config import config
from .openai_service import OpenAIService
from .ml_engine import MLEngine
from ..voice.coqui_tts import CoquiTTSEngine

class Chatbot:
    def __init__(self):
        logger.info("Initializing Young Ellens chatbot (lazy loading)")
        
        # Lazy initialize AI services for better startup performance
        self.openai_service = None
        self.ml_engine = None
        self.voice_engine = None
        
        # Response mode: 'local', 'ai', 'hybrid'
        self.response_mode = config.get("ai.response_mode", "hybrid")
        
        # Voice settings
        self.voice_enabled = config.get("voice.enabled", False)
        
        # Conversation history for context
        self.conversation_history = []
        
        self.general_responses = [
            "Yo, that's fire! 🔥",
            "I feel you, that's real talk.",
            "Respect, keep grinding!",
            "That hits different, for real.",
            "Big mood, I'm with that energy.",
            "Facts, that's the vibe!",
            "You speaking truth right there.",
            "I see you, that's solid.",
            "Pure fire, keep that up!",
            "Real recognize real!",
            "B-Negar, dat is echt niet normaal!",
            "OWO! Wat een verhaal zeg!",
            "B, B, Pa! Je hebt helemaal gelijk.",
            "020 representing, altijd!",
            "Dat is echt Amsterdam style!",
            "Je weet toch, we blijven hustlen!",
            "Geen stress, alles komt goed!",
            "Ik snap je helemaal, broeder!",
            "Dat is echt next level!",
            "Safe man, I'm with that!",
            "Echt waar? Dat is sick!",
            "Jonge, dat klinkt goed!",
            "Voor sure, I feel that energy!",
            "Dat is echt too much, maar wel goed!"
        ]
        
        # Context-aware responses
        self.contextual_responses = {
            'greeting': [
                "Yooo! What's good fam? 😎",
                "Ey yo! Ready to vibe? 🎤",
                "B-Negar! How you doing? 🔥",
                "Safe bro! What's happening today?",
                "OWO! Glad to see you here! 💯"
            ],
            'music': [
                "B-Negar! Music is life, you feel me? 🎵",
                "Yo, that beat is absolutely fire! 🔥🎤",
                "Music connects souls, that's facts! 🎶",
                "I live for those sick beats! 💯",
                "Real music touches your heart, no cap! ❤️🎵"
            ],
            'amsterdam': [
                "020 representing! Amsterdam is mijn stad! 🏙️",
                "Amsterdam Noord to Zuid, we run this! 💪",
                "Echt waar? Fellow Amsterdam person! 🚲",
                "From the canals to the streets, 020 forever! 🌊",
                "Amsterdam vibes are unmatched, period! 🔥"
            ],
            'positive': [
                "YOOO! That's straight fire! 🔥🔥🔥",
                "B, B, Pa! You're absolutely killing it! 💯",
                "OWO! That energy is infectious! ⚡",
                "Facts! Keep that positive vibe going! ✨",
                "That's the spirit I love to see! 🙌"
            ],
            'questions': [
                "Good question fam, let me think... 🤔",
                "Hmm, that's deep! Here's what I think...",
                "B-Negar, you got me thinking! 💭",
                "Interesting question, safe! 🧠",
                "OWO! That's actually a solid question!"
            ],
            'drugs': [
                "Alleen me wietje en me henny, verder niks! 🚫",
                "Nah fam, we keep it clean! Just good vibes! ✋",
                "I'm about that natural high, you know? 🌿",
                "We don't need that stuff for good times! 😎",
                "Life's already crazy enough without that! 💯"
            ],
            'compliment': [
                "Ey, appreciate you fam! Real recognize real! 🙏",
                "B-Negar! You're too kind! 😊",
                "That means a lot, safe! Keep being awesome! ✨",
                "OWO! You just made my day! 💫",
                "Respect! Right back at you! 💪"
            ]
        }
        
        self.mood_responses = {
            'happy': [
                "YOOO! 🎉 I'm feeling mad good right now!",
                "B-Negar! Everything is FIRE today! 🔥",
                "OWO! Life is beautiful, you feel me?",
                "Pure joy in my circuits today! ✨",
                "Can't stop smiling, the vibes are immaculate! 😊"
            ],
            'chill': [
                "Just vibing, you know how it is... 😌",
                "Keeping it real, staying relaxed 😎",
                "Everything's smooth, no worries here.",
                "Taking it easy, that's the Amsterdam way 🚲",
                "Peaceful energy, I'm with it 🌿"
            ],
            'hyped': [
                "BRO! I'M SO HYPED RIGHT NOW! 🚀",
                "B, B, PA! LET'S GOOOOO!",
                "ENERGY THROUGH THE ROOF! 💯",
                "CAN'T CONTAIN THIS EXCITEMENT! ⚡",
                "AMSTERDAM ENERGY IS UNMATCHED! 🔥🔥"
            ],
            'contemplative': [
                "Sometimes you gotta think deep, you know? 🤔",
                "Life's got layers, like an onion... but good 💭",
                "Amsterdam taught me to reflect on things 🌊",
                "Wise thoughts coming through... 🧠"
            ]
        }
        
        # Conversation patterns for smarter responses
        self.conversation_keywords = {
            'greeting': ['hi', 'hello', 'hey', 'yo', 'sup', 'what\'s up', 'hoi', 'hallo'],
            'music': ['music', 'rap', 'beat', 'song', 'track', 'album', 'muziek', 'nummer'],
            'amsterdam': ['amsterdam', '020', 'noord', 'zuid', 'dam', 'canal', 'bike', 'fiets'],
            'positive': ['good', 'great', 'awesome', 'amazing', 'fire', 'sick', 'dope', 'cool'],
            'questions': ['what', 'how', 'why', 'when', 'where', 'who', '?'],
            'drugs': ['drugs', 'cocaine', 'coke', 'pills', 'mdma', 'xtc', 'speed'],
            'compliment': ['smart', 'cool', 'funny', 'nice', 'awesome', 'amazing', 'great']
        }
        
        self.current_mood = 'chill'
        self.last_response_time = time.time()
        self.conversation_count = 0
        
        # Load personality context on startup
        self._load_personality_context()
        
        logger.info("Young Ellens chatbot initialized successfully")
    
    def set_openai_key(self, api_key: str) -> bool:
        """Set OpenAI API key"""
        return self.openai_service.set_api_key(api_key)
    
    def set_response_mode(self, mode: str):
        """Set response mode: 'local', 'ai', 'hybrid'"""
        if mode in ['local', 'ai', 'hybrid']:
            self.response_mode = mode
            config.set("ai.response_mode", mode)
            logger.info(f"Response mode set to: {mode}")
        else:
            logger.warning(f"Invalid response mode: {mode}")
    
    def get_ai_status(self) -> dict:
        """Get AI services status"""
        return {
            "openai_available": self.openai_service.is_api_available(),
            "ml_engine_active": self.ml_engine is not None,
            "response_mode": self.response_mode,
            "conversation_count": len(self.conversation_history),
            "openai_stats": self.openai_service.get_usage_stats()
        }
    
    def get_conversation_insights(self) -> dict:
        """Get ML conversation insights"""
        return self.ml_engine.get_conversation_insights()
    
    def rate_last_response(self, rating: float):
        """Rate the last AI response (1-5 scale)"""
        if self.conversation_history and len(self.conversation_history) >= 2:
            last_user_msg = None
            last_ai_msg = None
            
            # Find last user and AI messages
            for msg in reversed(self.conversation_history):
                if msg["sender"] == "ai" and last_ai_msg is None:
                    last_ai_msg = msg["content"]
                elif msg["sender"] == "user" and last_user_msg is None:
                    last_user_msg = msg["content"]
                
                if last_user_msg and last_ai_msg:
                    break
            
            if last_user_msg and last_ai_msg:
                self.ml_engine.learn_from_conversation(last_user_msg, last_ai_msg, rating)
                logger.info(f"Response rated: {rating}/5")
    
    def clear_conversation_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        logger.info("Conversation history cleared")
    
    def export_learning_data(self) -> dict:
        """Export learning data for analysis"""
        return {
            "conversation_history": self.conversation_history,
            "insights": self.get_conversation_insights(),
            "ai_status": self.get_ai_status()
        }
    
    # Voice-related methods
    def set_voice_enabled(self, enabled: bool):
        """Enable or disable voice responses"""
        self.voice_enabled = enabled
        self.voice_engine.set_voice_settings(enabled=enabled)
        config.set("voice.enabled", enabled)
        logger.info(f"Voice {'enabled' if enabled else 'disabled'}")
    
    def load_voice_model(self, model_path: str) -> bool:
        """Load a specific voice model"""
        return self.voice_engine.load_model(model_path)
    
    def train_young_ellens_voice(self, reference_audio_path: str) -> bool:
        """Train Young Ellens voice from reference audio"""
        return self.voice_engine.train_voice_model(reference_audio_path)
    
    def get_voice_status(self) -> dict:
        """Get voice system status"""
        base_status = self.voice_engine.get_voice_status()
        base_status["voice_enabled"] = self.voice_enabled
        return base_status
    
    def get_available_voice_models(self) -> list:
        """Get list of available voice models"""
        return self.voice_engine.get_voice_models()
    
    def stop_voice_playback(self):
        """Stop current voice playback"""
        self.voice_engine.stop_playback()
    
    def test_voice_synthesis(self, test_text: str = "Yo! B-Negar, this is Young Ellens testing the voice system! 🎤") -> bool:
        """Test voice synthesis with sample text"""
        try:
            audio_path = self.voice_engine.synthesize_speech(test_text)
            if audio_path:
                self.voice_engine.play_audio(audio_path)
                return True
            return False
        except Exception as e:
            logger.error(f"Voice test failed: {e}")
            return False
    
    def _ensure_openai_service(self):
        """Lazy initialization of OpenAI service"""
        if self.openai_service is None:
            try:
                self.openai_service = OpenAIService()
                logger.debug("OpenAI service initialized on demand")
            except Exception as e:
                logger.error(f"Error initializing OpenAI service: {e}")
    
    def _ensure_ml_engine(self):
        """Lazy initialization of ML engine"""
        if self.ml_engine is None:
            try:
                self.ml_engine = MLEngine()
                logger.debug("ML engine initialized on demand")
            except Exception as e:
                logger.error(f"Error initializing ML engine: {e}")
    
    def _ensure_voice_engine(self):
        """Lazy initialization of voice engine"""
        if self.voice_engine is None:
            try:
                self.voice_engine = CoquiTTSEngine()
                logger.debug("Voice engine initialized on demand")
            except Exception as e:
                logger.error(f"Error initializing voice engine: {e}")
    
    def generate_response(self, user_message: str, callback: Callable[[str], None], voice_callback: Optional[Callable] = None):
        """Generate AI response with realistic delay and smart context awareness"""
        def _generate():
            try:
                # Get typing delay from config
                min_delay = config.get("chat.typing_delay_min", 0.8)
                max_delay = config.get("chat.typing_delay_max", 2.5)
                
                # Simulate thinking time (longer for complex messages)
                message_complexity = len(user_message.split()) / 10
                base_delay = random.uniform(min_delay, max_delay)
                delay = min(base_delay + message_complexity, 4.0)
                
                time.sleep(delay)
                
                # Increment conversation counter
                self.conversation_count += 1
                
                # Generate intelligent response
                response = self._generate_smart_response(user_message)
                
                # Log the interaction
                logger.debug(f"User: {user_message}")
                logger.debug(f"Young Ellens: {response}")
                
                # Send text response first
                callback(response)
                
                # Generate voice if enabled
                if self.voice_enabled:
                    self._ensure_voice_engine()
                    if self.voice_engine and self.voice_engine.is_available():
                        self.voice_engine.speak_text(response, voice_callback)
                    elif voice_callback:
                        voice_callback()
                elif voice_callback:
                    voice_callback()
                
            except Exception as e:
                logger.error(f"Error generating response: {e}")
                fallback_response = "Ey yo, something went wrong! But I'm still here for you! 😅"
                callback(fallback_response)
                if voice_callback:
                    voice_callback()
        
        thread = threading.Thread(target=_generate)
        thread.daemon = True
        thread.start()
    
    def _generate_smart_response(self, user_message: str) -> str:
        """Generate contextually aware response using AI/ML and fallbacks"""
        user_lower = user_message.lower()
        
        # Add to conversation history
        self.conversation_history.append({
            "content": user_message,
            "sender": "user",
            "timestamp": time.time()
        })
        
        # Keep conversation history manageable
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]
        
        response = None
        
        # Try different response methods based on mode
        if self.response_mode == "ai" or self.response_mode == "hybrid":
            # Try OpenAI first
            response = self._get_openai_response(user_message)
            
            # If OpenAI fails and we're in hybrid mode, try ML
            if not response and self.response_mode == "hybrid":
                response = self._get_ml_response(user_message)
        
        elif self.response_mode == "hybrid":
            # Try ML first, then OpenAI
            response = self._get_ml_response(user_message)
            if not response:
                response = self._get_openai_response(user_message)
        
        # Fallback to local responses
        if not response:
            response = self._get_local_response(user_lower)
        
        # Add to conversation history
        self.conversation_history.append({
            "content": response,
            "sender": "ai",
            "timestamp": time.time()
        })
        
        # Learn from this interaction
        self._learn_from_interaction(user_message, response)
        
        return response
    
    def _get_openai_response(self, user_message: str) -> Optional[str]:
        """Get response from OpenAI API"""
        try:
            if self.openai_service.is_api_available():
                return self.openai_service.generate_response(user_message, self.conversation_history)
            return None
        except Exception as e:
            logger.error(f"OpenAI response error: {e}")
            return None
    
    def _get_ml_response(self, user_message: str) -> Optional[str]:
        """Get ML-enhanced response"""
        try:
            return self.ml_engine.get_ml_enhanced_response(user_message)
        except Exception as e:
            logger.error(f"ML response error: {e}")
            return None
    
    def _get_local_response(self, user_lower: str) -> str:
        """Get local rule-based response (fallback)"""
        # Detect conversation context
        detected_context = self._detect_context(user_lower)
        
        # Handle mood changes
        self._update_mood(user_lower)
        
        # Generate response based on context
        if detected_context and detected_context in self.contextual_responses:
            response = random.choice(self.contextual_responses[detected_context])
        elif random.random() < 0.3 and self.current_mood in self.mood_responses:
            # Sometimes use mood-based responses
            response = random.choice(self.mood_responses[self.current_mood])
        else:
            # Fall back to general responses
            response = random.choice(self.general_responses)
        
        # Add conversation variety
        response = self._add_personality_touches(response, user_lower)
        
        return response
    
    def _learn_from_interaction(self, user_message: str, bot_response: str):
        """Learn from user interaction"""
        try:
            self.ml_engine.learn_from_conversation(user_message, bot_response)
        except Exception as e:
            logger.error(f"Learning error: {e}")
    
    def _detect_context(self, user_message: str) -> Optional[str]:
        """Detect the context/topic of user message"""
        for context, keywords in self.conversation_keywords.items():
            if any(keyword in user_message for keyword in keywords):
                return context
        return None
    
    def _update_mood(self, user_message: str):
        """Update Young Ellens mood based on conversation"""
        # Mood change probability increases with conversation length
        mood_change_prob = min(0.15 + (self.conversation_count * 0.01), 0.4)
        
        if random.random() < mood_change_prob:
            # Detect user's energy and respond accordingly
            if any(word in user_message for word in ['excited', 'hyped', '!', 'awesome', 'amazing']):
                self.current_mood = 'hyped'
            elif any(word in user_message for word in ['sad', 'down', 'tired', 'stressed']):
                self.current_mood = 'chill'
            elif any(word in user_message for word in ['think', 'philosophy', 'deep', 'meaning']):
                self.current_mood = 'contemplative'
            else:
                moods = ['happy', 'chill', 'hyped', 'contemplative']
                self.current_mood = random.choice(moods)
            
            logger.debug(f"Mood changed to: {self.current_mood}")
    
    def _add_personality_touches(self, response: str, user_message: str) -> str:
        """Add random personality touches to make responses more authentic"""
        # Occasionally add signature phrases
        if random.random() < 0.1:  # 10% chance
            signatures = ["B-Negar!", "OWO!", "B, B, Pa!", "Safe!", "Voor real!"]
            signature = random.choice(signatures)
            if signature not in response:
                response = f"{signature} {response}"
        
        # Add emphasis for excitement
        if self.current_mood == 'hyped' and random.random() < 0.3:
            response = response.upper()
        
        # Sometimes reference conversation count for continuity
        if self.conversation_count > 10 and random.random() < 0.05:
            response += " We've been chatting for a while now, I'm enjoying this! 💬"
        
        return response
    
    def get_greeting(self) -> str:
        """Get a greeting message"""
        greetings = [
            "Yo! Young Ellens hier! What's good? 😎",
            "B-Negar! Ready to chat? 🎤",
            "OWO! What's happening today? 🔥",
            "Ey yo! Amsterdam in the building! 020! 🏙️"
        ]
        return random.choice(greetings)
    
    def _load_personality_context(self):
        """Load personality context into AI services"""
        try:
            # Load context into OpenAI service
            self.openai_service.load_personality_context()
            
            # Note: ML engine could also use context if implemented
            logger.info("Personality context loaded into AI services")
            
        except Exception as e:
            logger.error(f"Error loading personality context: {e}")
    
    def add_personality_context(self, filename: str, content: str):
        """Add personality context from uploaded files"""
        try:
            # Add to OpenAI service
            self.openai_service.add_personality_context(filename, content)
            
            # Note: Could also add to ML engine or local responses
            logger.info(f"Added personality context from {filename}")
            
        except Exception as e:
            logger.error(f"Error adding personality context: {e}")
    
    def clear_personality_context(self):
        """Clear all personality context"""
        try:
            # Clear from OpenAI service
            self.openai_service.clear_personality_context()
            
            logger.info("Cleared personality context from all AI services")
            
        except Exception as e:
            logger.error(f"Error clearing personality context: {e}")