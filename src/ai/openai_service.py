import openai
import asyncio
import json
from typing import Optional, Dict, Any
from ..utils.logger import logger
from ..utils.config import config

class OpenAIService:
    """OpenAI API integration for advanced Young Ellens responses"""
    
    def __init__(self):
        self.client = None
        self.api_key = None
        self.model = "gpt-3.5-turbo"
        self.max_tokens = 150
        self.temperature = 0.8
        self.is_available = False
        
        # Default system prompt for CloneKing personas
        self.base_system_prompt = """You are an AI persona with a unique personality and character. 
        
Your role is to embody the specific personality traits, communication style, and knowledge domains 
that have been configured for you. Stay consistent with your persona's characteristics throughout 
all interactions.

Always respond as your specific persona would, using their preferred communication style and 
drawing upon their knowledge domains when relevant."""

        # Dynamic system prompt (updated with personality context)
        self.system_prompt = self.base_system_prompt
        
        self._initialize_api()
    
    def _initialize_api(self):
        """Initialize OpenAI API if key is available"""
        try:
            # Try to get API key from config
            self.api_key = config.get("ai.openai_api_key")
            
            if self.api_key and self.api_key != "your_openai_api_key_here":
                openai.api_key = self.api_key
                self.client = openai.OpenAI(api_key=self.api_key)
                self.is_available = True
                logger.info("OpenAI API initialized successfully")
            else:
                logger.info("OpenAI API key not configured - using fallback responses")
                self.is_available = False
                
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI API: {e}")
            self.is_available = False
    
    def set_api_key(self, api_key: str) -> bool:
        """Set OpenAI API key and reinitialize"""
        try:
            config.set("ai.openai_api_key", api_key)
            self.api_key = api_key
            openai.api_key = api_key
            self.client = openai.OpenAI(api_key=api_key)
            self.is_available = True
            logger.info("OpenAI API key updated successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to set OpenAI API key: {e}")
            return False
    
    async def generate_response_async(self, user_message: str, conversation_history: list = None) -> Optional[str]:
        """Generate AI response asynchronously"""
        if not self.is_available:
            return None
        
        try:
            # Build conversation context
            messages = [{"role": "system", "content": self.system_prompt}]
            
            # Add conversation history (last 6 messages for context)
            if conversation_history:
                for msg in conversation_history[-6:]:
                    role = "user" if msg.get("sender") == "user" else "assistant"
                    messages.append({"role": role, "content": msg.get("content", "")})
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Generate response
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                presence_penalty=0.6,
                frequency_penalty=0.3
            )
            
            ai_response = response.choices[0].message.content.strip()
            logger.debug(f"OpenAI response generated: {ai_response}")
            
            return ai_response
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None
    
    def generate_response(self, user_message: str, conversation_history: list = None) -> Optional[str]:
        """Generate AI response synchronously"""
        if not self.is_available:
            return None
        
        try:
            # Build conversation context
            messages = [{"role": "system", "content": self.system_prompt}]
            
            # Add conversation history (last 6 messages for context)
            if conversation_history:
                for msg in conversation_history[-6:]:
                    role = "user" if msg.get("sender") == "user" else "assistant"
                    messages.append({"role": role, "content": msg.get("content", "")})
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Generate response
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                presence_penalty=0.6,
                frequency_penalty=0.3
            )
            
            ai_response = response.choices[0].message.content.strip()
            logger.debug(f"OpenAI response generated: {ai_response}")
            
            return ai_response
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None
    
    def is_api_available(self) -> bool:
        """Check if OpenAI API is available"""
        return self.is_available
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get API usage statistics"""
        return {
            "api_available": self.is_available,
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature
        }
    
    def update_settings(self, **kwargs):
        """Update OpenAI settings"""
        if "model" in kwargs:
            self.model = kwargs["model"]
            config.set("ai.openai_model", self.model)
        
        if "max_tokens" in kwargs:
            self.max_tokens = kwargs["max_tokens"]
            config.set("ai.openai_max_tokens", self.max_tokens)
        
        if "temperature" in kwargs:
            self.temperature = kwargs["temperature"]
            config.set("ai.openai_temperature", self.temperature)
        
        logger.info(f"OpenAI settings updated: {kwargs}")
    
    def load_persona_context(self, persona_id: str):
        """Load context from persona training data"""
        try:
            from pathlib import Path
            
            context_dir = Path.home() / ".cloneking" / "training" / persona_id / "text"
            
            if not context_dir.exists():
                return
            
            # Collect training text content
            context_content = ""
            for file_path in context_dir.glob("*"):
                if file_path.is_file() and file_path.suffix.lower() in ['.txt', '.md']:
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        # Clean content and add to context
                        clean_content = content.strip()
                        if clean_content and len(clean_content) > 10:  # Skip very short content
                            context_content += f"\n\n{clean_content}"
                            
                    except Exception as e:
                        logger.warning(f"Error reading training file {file_path.name}: {e}")
            
            # Update system prompt with training context
            if context_content.strip():
                # Limit context length to avoid token limits
                max_context_length = 2000
                if len(context_content) > max_context_length:
                    context_content = context_content[:max_context_length] + "..."
                
                enhanced_prompt = f"""{self.system_prompt}

TRAINING CONTEXT:
The following content represents your knowledge base and personality reference:
{context_content.strip()}

Use this context to inform your responses while staying true to your persona's characteristics."""
                
                self.system_prompt = enhanced_prompt
                logger.info(f"Loaded training context for persona {persona_id}")
                
        except Exception as e:
            logger.error(f"Error loading persona context: {e}")
    
    def set_persona_prompt(self, persona_prompt: str):
        """Set a specific persona system prompt"""
        try:
            self.system_prompt = persona_prompt
            logger.info("Updated system prompt with persona configuration")
        except Exception as e:
            logger.error(f"Error setting persona prompt: {e}")
    
    def reset_to_base_prompt(self):
        """Reset to base system prompt"""
        self.system_prompt = self.base_system_prompt
        logger.info("Reset to base system prompt")
    
    def get_available_models(self) -> list:
        """Get list of available OpenAI models"""
        try:
            if not self.is_available:
                return ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"]
            
            # Return commonly available models
            return [
                "gpt-3.5-turbo",
                "gpt-3.5-turbo-16k",
                "gpt-4",
                "gpt-4-turbo-preview",
                "gpt-4-turbo"
            ]
        except Exception as e:
            logger.error(f"Error getting available models: {e}")
            return ["gpt-3.5-turbo"]
    
    def test_api_connection(self) -> bool:
        """Test if API connection is working"""
        try:
            if not self.is_available:
                return False
            
            # Simple test request
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            
            return bool(response.choices[0].message.content)
            
        except Exception as e:
            logger.error(f"API connection test failed: {e}")
            return False