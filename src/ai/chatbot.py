import random
import time
import threading
import re
from typing import Callable, Optional, List
from ..utils.logger import logger
from ..utils.config import config

class Chatbot:
    def __init__(self):
        logger.info("Initializing Young Ellens chatbot")
        
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
        
        logger.info("Young Ellens chatbot initialized successfully")
    
    def generate_response(self, user_message: str, callback: Callable[[str], None]):
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
                
                callback(response)
                
            except Exception as e:
                logger.error(f"Error generating response: {e}")
                fallback_response = "Ey yo, something went wrong! But I'm still here for you! 😅"
                callback(fallback_response)
        
        thread = threading.Thread(target=_generate)
        thread.daemon = True
        thread.start()
    
    def _generate_smart_response(self, user_message: str) -> str:
        """Generate contextually aware response based on message analysis"""
        user_lower = user_message.lower()
        
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
        response = self._add_personality_touches(response, user_message)
        
        return response
    
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