import os
import io
import threading
import time
from pathlib import Path
from typing import Optional, Callable, Dict, Any, List
import numpy as np
from ..utils.logger import logger
from ..utils.config import config

try:
    import torch
    import torchaudio
    from TTS.api import TTS
    import soundfile as sf
    import librosa
    TTS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"TTS dependencies not available: {e}")
    TTS_AVAILABLE = False

try:
    import pygame
    PYGAME_AVAILABLE = True
except ImportError:
    logger.warning("Pygame not available for audio playback")
    PYGAME_AVAILABLE = False

class CoquiTTSEngine:
    """Advanced Coqui TTS engine for CloneKing persona voice cloning"""
    
    def __init__(self, persona_id: Optional[str] = None):
        self.tts_engine = None
        self.persona_id = persona_id
        self.voice_models_dir = Path.home() / ".cloneking" / "voice_models"
        if persona_id:
            self.persona_voice_dir = self.voice_models_dir / persona_id
            self.persona_voice_dir.mkdir(exist_ok=True, parents=True)
        else:
            self.persona_voice_dir = self.voice_models_dir
        self.voice_models_dir.mkdir(exist_ok=True, parents=True)
        
        # Voice settings
        self.current_voice_model = None
        self.voice_speed = 1.0
        self.voice_emotion = "neutral"
        self.voice_enabled = config.get("voice.enabled", False)
        
        # Available models
        self.available_models = []
        self.young_ellens_model_path = None
        
        # Audio playback
        self.audio_queue = []
        self.is_playing = False
        self.playback_thread = None
        
        if TTS_AVAILABLE:
            self._initialize_tts()
        else:
            logger.warning("TTS not available - voice features disabled")
        
        if PYGAME_AVAILABLE:
            self._initialize_audio()
        else:
            logger.warning("Audio playback not available")
    
    def _initialize_tts(self):
        """Initialize Coqui TTS engine"""
        try:
            logger.info("Initializing Coqui TTS engine...")
            
            # List available models
            self._discover_models()
            
            # Try to load a default model
            self._load_default_model()
            
            logger.info("Coqui TTS engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize TTS engine: {e}")
            self.tts_engine = None
    
    def _initialize_audio(self):
        """Initialize audio playback"""
        try:
            pygame.mixer.init(frequency=22050, size=-16, channels=2, buffer=512)
            logger.info("Audio playback initialized")
        except Exception as e:
            logger.error(f"Failed to initialize audio: {e}")
    
    def _discover_models(self):
        """Discover available TTS models"""
        try:
            # Get built-in models
            builtin_models = [
                "tts_models/en/ljspeech/tacotron2-DDC",
                "tts_models/en/ljspeech/glow-tts",
                "tts_models/en/ljspeech/speedy-speech",
                "tts_models/en/ljspeech/neural_hmm",
                "tts_models/multilingual/multi-dataset/xtts_v2",
            ]
            
            # Check for custom models
            custom_models = []
            if self.voice_models_dir.exists():
                for model_path in self.voice_models_dir.glob("*.pth"):
                    custom_models.append(str(model_path))
            
            self.available_models = builtin_models + custom_models
            logger.info(f"Found {len(self.available_models)} TTS models")
            
        except Exception as e:
            logger.error(f"Error discovering models: {e}")
            self.available_models = []
    
    def _load_default_model(self):
        """Load default TTS model"""
        try:
            # Try to use XTTS v2 for multilingual support
            default_model = "tts_models/multilingual/multi-dataset/xtts_v2"
            
            # Check if Young Ellens custom model exists
            young_ellens_model = self.voice_models_dir / "young_ellens_voice.pth"
            if young_ellens_model.exists():
                default_model = str(young_ellens_model)
                logger.info("Found Young Ellens custom voice model")
            
            self.load_model(default_model)
            
        except Exception as e:
            logger.error(f"Failed to load default model: {e}")
    
    def load_model(self, model_name_or_path: str) -> bool:
        """Load a specific TTS model"""
        try:
            logger.info(f"Loading TTS model: {model_name_or_path}")
            
            # Create TTS instance
            if os.path.exists(model_name_or_path):
                # Custom model
                self.tts_engine = TTS(model_path=model_name_or_path)
            else:
                # Built-in model
                self.tts_engine = TTS(model_name=model_name_or_path)
            
            self.current_voice_model = model_name_or_path
            config.set("voice.current_model", model_name_or_path)
            
            logger.info(f"TTS model loaded: {model_name_or_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load TTS model: {e}")
            self.tts_engine = None
            return False
    
    def synthesize_speech(self, text: str, output_path: Optional[str] = None) -> Optional[str]:
        """Synthesize speech from text"""
        if not self.is_available():
            logger.warning("TTS engine not available")
            return None
        
        try:
            # Clean and prepare text
            clean_text = self._prepare_text_for_tts(text)
            
            if not clean_text.strip():
                logger.warning("Empty text for TTS")
                return None
            
            # Generate output path if not provided
            if not output_path:
                timestamp = int(time.time())
                output_path = self.voice_models_dir / f"tts_output_{timestamp}.wav"
            
            logger.debug(f"Synthesizing speech: {clean_text[:50]}...")
            
            # Generate speech
            if hasattr(self.tts_engine, 'tts_to_file'):
                # For newer TTS versions
                self.tts_engine.tts_to_file(
                    text=clean_text,
                    file_path=str(output_path),
                    speaker_wav=self._get_speaker_reference() if self._is_xtts_model() else None,
                    language="en" if self._is_xtts_model() else None
                )
            else:
                # Fallback method
                wav = self.tts_engine.tts(clean_text)
                sf.write(str(output_path), wav, 22050)
            
            logger.info(f"Speech synthesized: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Speech synthesis failed: {e}")
            return None
    
    def _prepare_text_for_tts(self, text: str) -> str:
        """Prepare text for TTS synthesis"""
        # Remove emojis and special characters
        import re
        
        # Remove emojis
        emoji_pattern = re.compile("["
            u"\U0001F600-\U0001F64F"  # emoticons
            u"\U0001F300-\U0001F5FF"  # symbols & pictographs
            u"\U0001F680-\U0001F6FF"  # transport & map symbols
            u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
            u"\U00002500-\U00002BEF"  # chinese char
            u"\U00002702-\U000027B0"
            u"\U00002702-\U000027B0"
            u"\U000024C2-\U0001F251"
            u"\U0001f926-\U0001f937"
            u"\U00010000-\U0010ffff"
            u"\u2640-\u2642" 
            u"\u2600-\u2B55"
            u"\u200d"
            u"\u23cf"
            u"\u23e9"
            u"\u231a"
            u"\ufe0f"  # dingbats
            u"\u3030"
            "]+", flags=re.UNICODE)
        
        clean_text = emoji_pattern.sub('', text)
        
        # Replace slang with phonetic equivalents for better pronunciation
        replacements = {
            "B-Negar": "Be Negar",
            "OWO": "Oh Wow Oh",
            "B, B, Pa": "Be, Be, Pa",
            "020": "zero two zero",
            "yo": "hello",
            "fam": "family",
            "bro": "brother",
            "safe": "alright",
            "echt": "really",
            "alleen": "only",
            "me": "my",
            "wietje": "weed",
            "henny": "hennessy",
            "verder": "further",
            "niks": "nothing",
            "voor": "for",
            "real": "real",
            "dat": "that",
            "is": "is",
            "sick": "amazing",
            "fire": "awesome"
        }
        
        for slang, replacement in replacements.items():
            clean_text = re.sub(r'\b' + re.escape(slang) + r'\b', replacement, clean_text, flags=re.IGNORECASE)
        
        # Clean up extra spaces
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        return clean_text
    
    def _get_speaker_reference(self) -> Optional[str]:
        """Get speaker reference audio for voice cloning"""
        # Look for Young Ellens reference audio
        reference_files = [
            self.voice_models_dir / "young_ellens_reference.wav",
            self.voice_models_dir / "reference.wav",
            self.voice_models_dir / "speaker.wav"
        ]
        
        for ref_file in reference_files:
            if ref_file.exists():
                return str(ref_file)
        
        return None
    
    def _is_xtts_model(self) -> bool:
        """Check if current model is XTTS (supports voice cloning)"""
        if not self.current_voice_model:
            return False
        return "xtts" in self.current_voice_model.lower()
    
    def play_audio(self, audio_path: str, callback: Optional[Callable] = None):
        """Play audio file asynchronously"""
        if not PYGAME_AVAILABLE:
            logger.warning("Audio playback not available")
            return
        
        def _play():
            try:
                logger.debug(f"Playing audio: {audio_path}")
                
                # Load and play audio
                pygame.mixer.music.load(audio_path)
                pygame.mixer.music.play()
                
                # Wait for playback to finish
                while pygame.mixer.music.get_busy():
                    time.sleep(0.1)
                
                logger.debug("Audio playback finished")
                
                # Callback when done
                if callback:
                    callback()
                    
            except Exception as e:
                logger.error(f"Audio playback error: {e}")
                if callback:
                    callback()
        
        # Play in separate thread
        play_thread = threading.Thread(target=_play)
        play_thread.daemon = True
        play_thread.start()
    
    def speak_text(self, text: str, callback: Optional[Callable] = None):
        """Synthesize and speak text"""
        if not self.voice_enabled or not self.is_available():
            if callback:
                callback()
            return
        
        def _speak():
            try:
                # Synthesize speech
                audio_path = self.synthesize_speech(text)
                
                if audio_path and os.path.exists(audio_path):
                    # Play the audio
                    self.play_audio(audio_path, callback)
                    
                    # Clean up temporary file after a delay
                    def cleanup():
                        time.sleep(5)  # Wait a bit before cleanup
                        try:
                            os.remove(audio_path)
                        except:
                            pass
                    
                    cleanup_thread = threading.Thread(target=cleanup)
                    cleanup_thread.daemon = True
                    cleanup_thread.start()
                else:
                    if callback:
                        callback()
                        
            except Exception as e:
                logger.error(f"Text-to-speech error: {e}")
                if callback:
                    callback()
        
        # Speak in separate thread
        speak_thread = threading.Thread(target=_speak)
        speak_thread.daemon = True
        speak_thread.start()
    
    def train_voice_model(self, reference_audio_files: List[str], progress_callback: Optional[Callable] = None) -> bool:
        """Train a custom voice model from multiple reference audio files"""
        try:
            logger.info(f"Training voice model from {len(reference_audio_files)} audio files")
            
            if progress_callback:
                progress_callback(0, "Starting voice training...")
            
            # Create persona-specific voice directory
            persona_voice_dir = self.persona_voice_dir if self.persona_id else self.voice_models_dir
            
            # Process and combine reference audio files
            combined_audio = []
            processed_files = []
            
            for i, audio_path in enumerate(reference_audio_files):
                try:
                    if progress_callback:
                        progress_callback(
                            int((i / len(reference_audio_files)) * 50), 
                            f"Processing audio file {i+1}/{len(reference_audio_files)}..."
                        )
                    
                    # Load and preprocess audio
                    audio, sr = librosa.load(audio_path, sr=22050)
                    
                    # Remove silence and normalize
                    audio = self._preprocess_audio(audio, sr)
                    
                    if len(audio) > 22050:  # At least 1 second
                        combined_audio.append(audio)
                        processed_files.append(audio_path)
                        logger.debug(f"Processed: {audio_path}")
                    else:
                        logger.warning(f"Audio too short, skipping: {audio_path}")
                        
                except Exception as e:
                    logger.warning(f"Failed to process {audio_path}: {e}")
                    continue
            
            if not combined_audio:
                logger.error("No valid audio files found for training")
                return False
            
            if progress_callback:
                progress_callback(50, "Combining audio files...")
            
            # Combine all audio
            final_audio = np.concatenate(combined_audio)
            
            # Ensure minimum duration (30 seconds for better quality)
            min_length = 22050 * 30
            if len(final_audio) < min_length:
                # Repeat audio to meet minimum length
                repeats = int(min_length / len(final_audio)) + 1
                final_audio = np.tile(final_audio, repeats)[:min_length]
            
            # Limit maximum duration (10 minutes to avoid memory issues)
            max_length = 22050 * 600
            if len(final_audio) > max_length:
                final_audio = final_audio[:max_length]
            
            if progress_callback:
                progress_callback(75, "Saving voice model...")
            
            # Save the reference audio for XTTS
            if self._is_xtts_model() or not self.current_voice_model:
                reference_path = persona_voice_dir / "voice_reference.wav"
                sf.write(str(reference_path), final_audio, 22050)
                
                # Create voice metadata
                metadata = {
                    "persona_id": self.persona_id,
                    "reference_files": processed_files,
                    "total_duration": len(final_audio) / 22050,
                    "sample_rate": 22050,
                    "created_at": time.time(),
                    "model_type": "xtts_reference"
                }
                
                metadata_path = persona_voice_dir / "voice_metadata.json"
                with open(metadata_path, 'w') as f:
                    import json
                    json.dump(metadata, f, indent=2)
                
                self.young_ellens_model_path = str(reference_path)
                if self.persona_id:
                    config.set(f"voice.persona_{self.persona_id}_reference", str(reference_path))
                
                logger.info(f"Voice model trained successfully: {reference_path}")
                
                if progress_callback:
                    progress_callback(100, "Voice training completed!")
                
                return True
            
            else:
                logger.warning("Voice training not supported for current model type")
                return False
                
        except Exception as e:
            logger.error(f"Voice training failed: {e}")
            if progress_callback:
                progress_callback(-1, f"Training failed: {e}")
            return False
    
    def _preprocess_audio(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """Preprocess audio for voice training"""
        try:
            # Remove silence at beginning and end
            audio = librosa.effects.trim(audio, top_db=20)[0]
            
            # Normalize audio
            audio = librosa.util.normalize(audio)
            
            # Apply gentle noise reduction
            audio = self._reduce_noise(audio, sr)
            
            return audio
            
        except Exception as e:
            logger.warning(f"Audio preprocessing failed: {e}")
            return audio
    
    def _reduce_noise(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """Simple noise reduction using spectral gating"""
        try:
            # Compute spectral statistics
            stft = librosa.stft(audio)
            magnitude = np.abs(stft)
            
            # Estimate noise floor (bottom 10% of magnitudes)
            noise_floor = np.percentile(magnitude, 10)
            
            # Apply spectral gating
            mask = magnitude > (noise_floor * 2)
            stft_filtered = stft * mask
            
            # Convert back to time domain
            audio_filtered = librosa.istft(stft_filtered)
            
            return audio_filtered
            
        except Exception as e:
            logger.warning(f"Noise reduction failed: {e}")
            return audio
    
    def clone_voice_from_persona(self, source_persona_id: str) -> bool:
        """Clone voice model from another persona"""
        try:
            source_voice_dir = self.voice_models_dir / source_persona_id
            source_reference = source_voice_dir / "voice_reference.wav"
            
            if not source_reference.exists():
                logger.error(f"No voice reference found for persona {source_persona_id}")
                return False
            
            # Copy reference to current persona
            dest_reference = self.persona_voice_dir / "voice_reference.wav"
            import shutil
            shutil.copy2(source_reference, dest_reference)
            
            # Copy metadata
            source_metadata = source_voice_dir / "voice_metadata.json"
            if source_metadata.exists():
                dest_metadata = self.persona_voice_dir / "voice_metadata.json"
                with open(source_metadata, 'r') as f:
                    import json
                    metadata = json.load(f)
                
                # Update metadata for new persona
                metadata["persona_id"] = self.persona_id
                metadata["cloned_from"] = source_persona_id
                metadata["cloned_at"] = time.time()
                
                with open(dest_metadata, 'w') as f:
                    json.dump(metadata, f, indent=2)
            
            self.young_ellens_model_path = str(dest_reference)
            logger.info(f"Voice cloned from persona {source_persona_id}")
            return True
            
        except Exception as e:
            logger.error(f"Voice cloning failed: {e}")
            return False
    
    def analyze_voice_quality(self, audio_path: str) -> Dict[str, Any]:
        """Analyze audio quality for voice training"""
        try:
            audio, sr = librosa.load(audio_path, sr=22050)
            
            # Basic metrics
            duration = len(audio) / sr
            rms_energy = librosa.feature.rms(y=audio)[0]
            mean_energy = np.mean(rms_energy)
            
            # Spectral features
            spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
            mean_spectral_centroid = np.mean(spectral_centroids)
            
            # Zero crossing rate (speech clarity indicator)
            zcr = librosa.feature.zero_crossing_rate(audio)[0]
            mean_zcr = np.mean(zcr)
            
            # Signal-to-noise ratio estimate
            noise_floor = np.percentile(np.abs(audio), 10)
            signal_peak = np.percentile(np.abs(audio), 90)
            snr_estimate = 20 * np.log10(signal_peak / (noise_floor + 1e-10))
            
            # Quality score (0-100)
            quality_score = min(100, max(0, 
                (duration * 10) +  # Duration bonus
                (mean_energy * 100) +  # Energy bonus
                (snr_estimate * 2) +  # SNR bonus
                (50 if mean_zcr > 0.05 else 0)  # Speech clarity bonus
            ))
            
            return {
                "duration": duration,
                "mean_energy": float(mean_energy),
                "spectral_centroid": float(mean_spectral_centroid),
                "zero_crossing_rate": float(mean_zcr),
                "snr_estimate": float(snr_estimate),
                "quality_score": min(100, max(0, quality_score)),
                "suitable_for_training": duration >= 5.0 and quality_score >= 30,
                "recommendations": self._get_quality_recommendations(duration, quality_score, snr_estimate)
            }
            
        except Exception as e:
            logger.error(f"Voice quality analysis failed: {e}")
            return {
                "error": str(e),
                "suitable_for_training": False,
                "quality_score": 0
            }
    
    def _get_quality_recommendations(self, duration: float, quality_score: float, snr: float) -> List[str]:
        """Get recommendations for improving audio quality"""
        recommendations = []
        
        if duration < 5.0:
            recommendations.append("Audio should be at least 5 seconds long")
        if duration < 30.0:
            recommendations.append("For better quality, provide at least 30 seconds of audio")
        
        if quality_score < 30:
            recommendations.append("Overall audio quality is low - consider re-recording")
        elif quality_score < 60:
            recommendations.append("Audio quality could be improved with better recording conditions")
        
        if snr < 10:
            recommendations.append("High background noise detected - record in a quieter environment")
        elif snr < 20:
            recommendations.append("Some background noise present - consider noise reduction")
        
        if not recommendations:
            recommendations.append("Audio quality is good for voice training")
        
        return recommendations
    
    def get_voice_models(self) -> List[Dict[str, Any]]:
        """Get list of available voice models"""
        models = []
        
        for model in self.available_models:
            model_info = {
                "name": os.path.basename(model),
                "path": model,
                "type": "custom" if os.path.exists(model) else "builtin",
                "supports_cloning": "xtts" in model.lower(),
                "is_loaded": model == self.current_voice_model
            }
            models.append(model_info)
        
        return models
    
    def set_voice_settings(self, **kwargs):
        """Update voice settings"""
        if "enabled" in kwargs:
            self.voice_enabled = kwargs["enabled"]
            config.set("voice.enabled", self.voice_enabled)
        
        if "speed" in kwargs:
            self.voice_speed = kwargs["speed"]
            config.set("voice.speed", self.voice_speed)
        
        if "emotion" in kwargs:
            self.voice_emotion = kwargs["emotion"]
            config.set("voice.emotion", self.voice_emotion)
        
        logger.info(f"Voice settings updated: {kwargs}")
    
    def get_voice_status(self) -> Dict[str, Any]:
        """Get voice system status"""
        return {
            "tts_available": TTS_AVAILABLE,
            "audio_available": PYGAME_AVAILABLE,
            "engine_loaded": self.tts_engine is not None,
            "voice_enabled": self.voice_enabled,
            "current_model": self.current_voice_model,
            "available_models": len(self.available_models),
            "young_ellens_model": self.young_ellens_model_path,
            "supports_cloning": self._is_xtts_model()
        }
    
    def is_available(self) -> bool:
        """Check if TTS engine is available"""
        return TTS_AVAILABLE and self.tts_engine is not None
    
    def stop_playback(self):
        """Stop current audio playback"""
        if PYGAME_AVAILABLE:
            try:
                pygame.mixer.music.stop()
            except:
                pass