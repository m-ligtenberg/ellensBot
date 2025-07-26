import os
import asyncio
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
import concurrent.futures
from dataclasses import dataclass
from ..utils.logger import logger
from .video_analyzer import VideoAnalyzer
from .audio_analyzer import AudioAnalyzer
from ..voice.coqui_tts import CoquiTTSEngine

try:
    import cv2
    import librosa
    import numpy as np
    from PIL import Image
    import moviepy.editor as mp
    VIDEO_PROCESSING_AVAILABLE = True
except ImportError:
    logger.warning("Video processing dependencies not available")
    VIDEO_PROCESSING_AVAILABLE = False

@dataclass
class TrainingProgress:
    persona_id: str
    current_step: str
    progress_percentage: float
    estimated_time_remaining: Optional[float]
    status: str  # "running", "completed", "failed", "paused"
    details: str

class MultimodalTrainingPipeline:
    """Advanced multimodal training pipeline for AI personas"""
    
    def __init__(self):
        self.training_dir = Path.home() / ".cloneking" / "training"
        self.training_dir.mkdir(exist_ok=True, parents=True)
        self.active_trainings: Dict[str, TrainingProgress] = {}
        
        # Initialize analyzers
        self.video_analyzer = VideoAnalyzer()
        self.audio_analyzer = AudioAnalyzer()
        
        # Voice cloning engines per persona
        self.voice_engines: Dict[str, CoquiTTSEngine] = {}
        
        logger.info("Advanced multimodal training pipeline initialized")
        
    async def train_persona(
        self,
        persona_id: str,
        training_data: Dict[str, List[str]],
        progress_callback: Optional[Callable[[TrainingProgress], None]] = None
    ) -> bool:
        """Train a persona using multimodal data"""
        try:
            logger.info(f"Starting training for persona: {persona_id}")
            
            # Initialize training progress
            progress = TrainingProgress(
                persona_id=persona_id,
                current_step="Initializing",
                progress_percentage=0.0,
                estimated_time_remaining=None,
                status="running",
                details="Preparing training pipeline"
            )
            
            self.active_trainings[persona_id] = progress
            if progress_callback:
                progress_callback(progress)
            
            # Create persona training directory
            persona_training_dir = self.training_dir / persona_id
            persona_training_dir.mkdir(exist_ok=True)
            
            total_steps = len([k for k, v in training_data.items() if v])
            current_step = 0
            
            # Process audio files
            if training_data.get("audio"):
                current_step += 1
                progress.current_step = f"Processing audio files ({current_step}/{total_steps})"
                progress.progress_percentage = (current_step / total_steps) * 100
                progress.details = f"Processing {len(training_data['audio'])} audio files"
                
                if progress_callback:
                    progress_callback(progress)
                
                await self._process_audio_files(
                    training_data["audio"], 
                    persona_training_dir / "audio",
                    persona_id
                )
            
            # Process video files
            if training_data.get("video") and VIDEO_PROCESSING_AVAILABLE:
                current_step += 1
                progress.current_step = f"Processing video files ({current_step}/{total_steps})"
                progress.progress_percentage = (current_step / total_steps) * 100
                progress.details = f"Processing {len(training_data['video'])} video files"
                
                if progress_callback:
                    progress_callback(progress)
                
                await self._process_video_files(
                    training_data["video"],
                    persona_training_dir / "video",
                    persona_id
                )
            
            # Process text files
            if training_data.get("text"):
                current_step += 1
                progress.current_step = f"Processing text files ({current_step}/{total_steps})"
                progress.progress_percentage = (current_step / total_steps) * 100
                progress.details = f"Processing {len(training_data['text'])} text files"
                
                if progress_callback:
                    progress_callback(progress)
                
                await self._process_text_files(
                    training_data["text"],
                    persona_training_dir / "text",
                    persona_id
                )
            
            # Process image files
            if training_data.get("images"):
                current_step += 1
                progress.current_step = f"Processing image files ({current_step}/{total_steps})"
                progress.progress_percentage = (current_step / total_steps) * 100
                progress.details = f"Processing {len(training_data['images'])} image files"
                
                if progress_callback:
                    progress_callback(progress)
                
                await self._process_image_files(
                    training_data["images"],
                    persona_training_dir / "images",
                    persona_id
                )
            
            # Final synthesis step
            progress.current_step = "Synthesizing persona model"
            progress.progress_percentage = 95.0
            progress.details = "Creating unified persona model"
            
            if progress_callback:
                progress_callback(progress)
            
            await self._synthesize_persona_model(persona_id, persona_training_dir)
            
            # Complete training
            progress.current_step = "Training completed"
            progress.progress_percentage = 100.0
            progress.status = "completed"
            progress.details = "Persona training successful"
            
            if progress_callback:
                progress_callback(progress)
            
            logger.info(f"Training completed for persona: {persona_id}")
            return True
            
        except Exception as e:
            logger.error(f"Training failed for persona {persona_id}: {e}")
            
            if persona_id in self.active_trainings:
                self.active_trainings[persona_id].status = "failed"
                self.active_trainings[persona_id].details = f"Training failed: {str(e)}"
                if progress_callback:
                    progress_callback(self.active_trainings[persona_id])
            
            return False
    
    async def _process_audio_files(self, audio_files: List[str], output_dir: Path, persona_id: str):
        """Advanced audio processing with comprehensive analysis and voice training"""
        try:
            output_dir.mkdir(exist_ok=True, parents=True)
            
            # Create persona-specific voice engine
            if persona_id not in self.voice_engines:
                self.voice_engines[persona_id] = CoquiTTSEngine(persona_id)
            
            voice_engine = self.voice_engines[persona_id]
            
            # Analysis results storage
            audio_analyses = []
            suitable_files = []
            
            # Analyze each audio file
            for i, audio_file in enumerate(audio_files):
                logger.debug(f"Analyzing audio file {i+1}/{len(audio_files)}: {audio_file}")
                
                if not os.path.exists(audio_file):
                    logger.warning(f"Audio file not found: {audio_file}")
                    continue
                
                try:
                    # Comprehensive audio analysis
                    def analysis_progress(progress, message):
                        logger.debug(f"Audio analysis progress: {progress}% - {message}")
                    
                    analysis_result = self.audio_analyzer.analyze_audio(audio_file, analysis_progress)
                    
                    if "error" not in analysis_result:
                        audio_analyses.append(analysis_result)
                        
                        # Check if suitable for training
                        suitability = analysis_result.get("training_suitability", {})
                        if suitability.get("overall_score", 0) >= 40:  # Minimum threshold
                            suitable_files.append(audio_file)
                            logger.info(f"Audio file suitable for training: {Path(audio_file).name} (Score: {suitability.get('overall_score', 0):.1f})")
                        else:
                            logger.warning(f"Audio file quality too low: {Path(audio_file).name} (Score: {suitability.get('overall_score', 0):.1f})")
                    
                except Exception as e:
                    logger.error(f"Error analyzing audio file {audio_file}: {e}")
                    continue
            
            # Save analysis results
            analysis_file = output_dir / "audio_analysis.json"
            with open(analysis_file, 'w') as f:
                json.dump({
                    "analyses": audio_analyses,
                    "suitable_files": suitable_files,
                    "total_files": len(audio_files),
                    "analysis_timestamp": datetime.now().isoformat()
                }, f, indent=2)
            
            # Train voice model with suitable files
            if suitable_files:
                logger.info(f"Training voice model with {len(suitable_files)} suitable audio files")
                
                def training_progress(progress, message):
                    logger.debug(f"Voice training progress: {progress}% - {message}")
                
                training_success = voice_engine.train_voice_model(suitable_files, training_progress)
                
                if training_success:
                    logger.info(f"Voice model training completed for persona {persona_id}")
                    
                    # Extract voice segments for additional training data
                    logger.info("Extracting voice segments for enhanced training...")
                    all_segments = []
                    
                    for audio_file in suitable_files:
                        segments = self.audio_analyzer.extract_voice_segments(audio_file)
                        all_segments.extend(segments)
                    
                    if all_segments:
                        segments_dir = output_dir / "voice_segments"
                        segments_dir.mkdir(exist_ok=True)
                        
                        # Copy segments to training directory
                        for i, segment_path in enumerate(all_segments):
                            dest_path = segments_dir / f"segment_{i:03d}.wav"
                            import shutil
                            shutil.copy2(segment_path, dest_path)
                        
                        logger.info(f"Extracted {len(all_segments)} voice segments")
                else:
                    logger.error(f"Voice model training failed for persona {persona_id}")
            else:
                logger.warning(f"No suitable audio files found for voice training (persona: {persona_id})")
            
            # Store comprehensive voice characteristics
            await self._extract_advanced_voice_features(audio_analyses, persona_id)
            
            logger.info(f"Advanced audio processing completed for persona {persona_id}")
            
        except Exception as e:
            logger.error(f"Error in advanced audio processing: {e}")
            raise
    
    async def _process_video_files(self, video_files: List[str], output_dir: Path, persona_id: str):
        """Advanced video processing with comprehensive analysis"""
        try:
            output_dir.mkdir(exist_ok=True, parents=True)
            
            video_analyses = []
            extracted_audio_files = []
            
            for i, video_file in enumerate(video_files):
                logger.debug(f"Processing video file {i+1}/{len(video_files)}: {video_file}")
                
                if not os.path.exists(video_file):
                    logger.warning(f"Video file not found: {video_file}")
                    continue
                
                try:
                    # Comprehensive video analysis
                    def video_progress(progress, message):
                        logger.debug(f"Video analysis progress: {progress}% - {message}")
                    
                    analysis_result = self.video_analyzer.analyze_video(video_file, video_progress)
                    
                    if "error" not in analysis_result:
                        video_analyses.append(analysis_result)
                        
                        # Extract training clips if video is suitable
                        suitability = analysis_result.get("training_suitability", {})
                        if suitability.get("overall_score", 0) >= 40:
                            logger.info(f"Extracting training clips from: {Path(video_file).name}")
                            
                            clips_dir = output_dir / f"clips_{i:03d}"
                            training_clips = self.video_analyzer.extract_training_clips(
                                video_file, analysis_result, str(clips_dir)
                            )
                            
                            if training_clips:
                                logger.info(f"Extracted {len(training_clips)} training clips")
                                
                                # Process audio from clips
                                for clip_path in training_clips:
                                    try:
                                        if VIDEO_PROCESSING_AVAILABLE:
                                            video_clip = mp.VideoFileClip(clip_path)
                                            if video_clip.audio:
                                                audio_output = output_dir / f"clip_audio_{Path(clip_path).stem}.wav"
                                                video_clip.audio.write_audiofile(str(audio_output), verbose=False, logger=None)
                                                extracted_audio_files.append(str(audio_output))
                                                video_clip.close()
                                    except Exception as e:
                                        logger.warning(f"Failed to extract audio from clip {clip_path}: {e}")
                        else:
                            logger.warning(f"Video quality too low for training: {Path(video_file).name} (Score: {suitability.get('overall_score', 0):.1f})")
                    
                except Exception as e:
                    logger.error(f"Error analyzing video file {video_file}: {e}")
                    continue
            
            # Save video analysis results
            analysis_file = output_dir / "video_analysis.json"
            with open(analysis_file, 'w') as f:
                json.dump({
                    "analyses": video_analyses,
                    "extracted_audio_files": extracted_audio_files,
                    "total_files": len(video_files),
                    "analysis_timestamp": datetime.now().isoformat()
                }, f, indent=2)
            
            # Process extracted audio for voice training
            if extracted_audio_files:
                logger.info(f"Processing {len(extracted_audio_files)} audio tracks extracted from videos")
                
                # Create voice engine if not exists
                if persona_id not in self.voice_engines:
                    self.voice_engines[persona_id] = CoquiTTSEngine(persona_id)
                
                # Analyze and potentially use extracted audio for voice training
                suitable_audio = []
                for audio_file in extracted_audio_files:
                    try:
                        analysis = self.audio_analyzer.analyze_audio(audio_file)
                        if "error" not in analysis:
                            suitability = analysis.get("training_suitability", {})
                            if suitability.get("overall_score", 0) >= 30:  # Lower threshold for video audio
                                suitable_audio.append(audio_file)
                    except Exception as e:
                        logger.warning(f"Failed to analyze extracted audio {audio_file}: {e}")
                
                if suitable_audio:
                    logger.info(f"Found {len(suitable_audio)} suitable audio tracks from videos")
                    # These can be used alongside regular audio files for voice training
            
            # Extract comprehensive visual and behavioral characteristics
            await self._extract_advanced_visual_features(video_analyses, persona_id)
            
            logger.info(f"Advanced video processing completed for persona {persona_id}")
            
        except Exception as e:
            logger.error(f"Error in advanced video processing: {e}")
            raise
    
    async def _process_text_files(self, text_files: List[str], output_dir: Path, persona_id: str):
        """Process text files for personality and knowledge extraction"""
        try:
            output_dir.mkdir(exist_ok=True, parents=True)
            
            all_text_content = []
            
            for i, text_file in enumerate(text_files):
                logger.debug(f"Processing text file {i+1}/{len(text_files)}: {text_file}")
                
                if not os.path.exists(text_file):
                    logger.warning(f"Text file not found: {text_file}")
                    continue
                
                try:
                    with open(text_file, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    if content.strip():
                        all_text_content.append(content)
                        
                        # Save processed text
                        output_file = output_dir / f"processed_{i:03d}.txt"
                        with open(output_file, 'w', encoding='utf-8') as f:
                            f.write(content)
                
                except Exception as e:
                    logger.error(f"Error processing text file {text_file}: {e}")
                    continue
            
            # Analyze combined text for personality traits
            if all_text_content:
                await self._extract_personality_features(all_text_content, persona_id)
            
            logger.info(f"Processed {len(text_files)} text files for persona {persona_id}")
            
        except Exception as e:
            logger.error(f"Error in text processing: {e}")
            raise
    
    async def _process_image_files(self, image_files: List[str], output_dir: Path, persona_id: str):
        """Process image files for visual characteristics"""
        try:
            output_dir.mkdir(exist_ok=True, parents=True)
            
            for i, image_file in enumerate(image_files):
                logger.debug(f"Processing image file {i+1}/{len(image_files)}: {image_file}")
                
                if not os.path.exists(image_file):
                    logger.warning(f"Image file not found: {image_file}")
                    continue
                
                try:
                    # Load and process image
                    image = Image.open(image_file)
                    
                    # Convert to RGB if necessary
                    if image.mode != 'RGB':
                        image = image.convert('RGB')
                    
                    # Save processed image
                    output_file = output_dir / f"processed_{i:03d}.jpg"
                    image.save(output_file, "JPEG", quality=95)
                    
                    # Extract visual features
                    await self._extract_image_features(image, persona_id)
                    
                except Exception as e:
                    logger.error(f"Error processing image file {image_file}: {e}")
                    continue
            
            logger.info(f"Processed {len(image_files)} image files for persona {persona_id}")
            
        except Exception as e:
            logger.error(f"Error in image processing: {e}")
            raise
    
    async def _extract_advanced_voice_features(self, audio_analyses: List[Dict], persona_id: str):
        """Extract comprehensive voice features from audio analyses"""
        try:
            if not audio_analyses:
                logger.warning(f"No audio analyses available for persona {persona_id}")
                return
            
            # Combine features from all analyses
            combined_features = {
                "voice_characteristics": {},
                "prosodic_patterns": {},
                "emotional_profile": {},
                "quality_metrics": {},
                "training_metadata": {
                    "total_audio_files": len(audio_analyses),
                    "analysis_timestamp": datetime.now().isoformat()
                }
            }
            
            # Aggregate features
            spectral_features = []
            prosodic_features = []
            emotional_features = []
            quality_scores = []
            
            for analysis in audio_analyses:
                if "spectral_features" in analysis:
                    spectral_features.append(analysis["spectral_features"])
                if "prosodic_features" in analysis:
                    prosodic_features.append(analysis["prosodic_features"])
                if "emotional_indicators" in analysis:
                    emotional_features.append(analysis["emotional_indicators"])
                if "voice_quality" in analysis:
                    quality_scores.append(analysis["voice_quality"].get("overall_quality_score", 0))
            
            # Average spectral characteristics
            if spectral_features:
                combined_features["voice_characteristics"] = {
                    "average_pitch": np.mean([f.get("spectral_centroid_mean", 0) for f in spectral_features]),
                    "pitch_variance": np.std([f.get("spectral_centroid_mean", 0) for f in spectral_features]),
                    "spectral_brightness": np.mean([f.get("spectral_rolloff_mean", 0) for f in spectral_features]),
                    "voice_timbre": [np.mean([f.get("mfcc_means", [0]*13)[i] for f in spectral_features]) for i in range(13)]
                }
            
            # Average prosodic patterns
            if prosodic_features:
                combined_features["prosodic_patterns"] = {
                    "speaking_rate": np.mean([f.get("speech_rate", 0) for f in prosodic_features]),
                    "rhythm_regularity": np.mean([f.get("rhythm_regularity", 0) for f in prosodic_features]),
                    "pitch_range": np.mean([f.get("pitch_range", 0) for f in prosodic_features]),
                    "tempo_consistency": 1.0 / (np.std([f.get("tempo", 120) for f in prosodic_features]) + 1e-10)
                }
            
            # Emotional profile
            if emotional_features:
                combined_features["emotional_profile"] = {
                    "energy_level": np.mean([f.get("energy_level", 0.5) for f in emotional_features]),
                    "expressiveness": np.mean([f.get("energy_variation", 0.5) for f in emotional_features]),
                    "voice_confidence": np.mean([f.get("voice_brightness", 1000) for f in emotional_features]) / 1000
                }
            
            # Quality metrics
            if quality_scores:
                combined_features["quality_metrics"] = {
                    "average_quality": np.mean(quality_scores),
                    "quality_consistency": 1.0 / (np.std(quality_scores) + 1e-10),
                    "minimum_quality": np.min(quality_scores),
                    "maximum_quality": np.max(quality_scores)
                }
            
            # Store comprehensive voice features
            features_file = self.training_dir / persona_id / "advanced_voice_features.json"
            features_file.parent.mkdir(exist_ok=True, parents=True)
            
            with open(features_file, 'w') as f:
                json.dump(combined_features, f, indent=2, default=float)
            
            logger.info(f"Extracted advanced voice features for persona {persona_id}")
            
        except Exception as e:
            logger.error(f"Error extracting advanced voice features: {e}")
    
    async def _extract_advanced_visual_features(self, video_analyses: List[Dict], persona_id: str):
        """Extract comprehensive visual features from video analyses"""
        try:
            if not video_analyses:
                logger.warning(f"No video analyses available for persona {persona_id}")
                return
            
            # Combine features from all analyses
            combined_features = {
                "visual_characteristics": {},
                "behavioral_patterns": {},
                "personality_indicators": {},
                "training_metadata": {
                    "total_video_files": len(video_analyses),
                    "analysis_timestamp": datetime.now().isoformat()
                }
            }
            
            # Aggregate visual features
            face_detection_rates = []
            movement_patterns = []
            personality_indicators = []
            
            for analysis in video_analyses:
                if "visual_features" in analysis:
                    visual = analysis["visual_features"]
                    if "face_detection_rate" in visual:
                        face_detection_rates.append(visual["face_detection_rate"])
                    if "movement_analysis" in visual and isinstance(visual["movement_analysis"], dict):
                        movement_patterns.append(visual["movement_analysis"])
                
                if "personality_indicators" in analysis:
                    personality_indicators.append(analysis["personality_indicators"])
            
            # Visual characteristics
            if face_detection_rates:
                combined_features["visual_characteristics"] = {
                    "average_visibility": np.mean(face_detection_rates),
                    "visibility_consistency": 1.0 / (np.std(face_detection_rates) + 1e-10),
                    "camera_presence": "high" if np.mean(face_detection_rates) > 0.7 else "medium" if np.mean(face_detection_rates) > 0.4 else "low"
                }
            
            # Behavioral patterns
            if movement_patterns:
                avg_movements = [p.get("average_movement", 0) for p in movement_patterns if "average_movement" in p]
                if avg_movements:
                    combined_features["behavioral_patterns"] = {
                        "activity_level": np.mean(avg_movements),
                        "movement_consistency": 1.0 / (np.std(avg_movements) + 1e-10),
                        "expressiveness": "high" if np.mean(avg_movements) > 0.01 else "medium" if np.mean(avg_movements) > 0.005 else "low"
                    }
            
            # Personality indicators
            if personality_indicators:
                energy_levels = [p.get("energy_level", 0.5) for p in personality_indicators if "energy_level" in p]
                expressiveness_scores = [p.get("expressiveness", 0.5) for p in personality_indicators if "expressiveness" in p]
                
                if energy_levels or expressiveness_scores:
                    combined_features["personality_indicators"] = {
                        "energy_profile": np.mean(energy_levels) if energy_levels else 0.5,
                        "expressiveness_profile": np.mean(expressiveness_scores) if expressiveness_scores else 0.5,
                        "visual_confidence": np.mean(face_detection_rates) if face_detection_rates else 0.0
                    }
            
            # Store comprehensive visual features
            features_file = self.training_dir / persona_id / "advanced_visual_features.json"
            features_file.parent.mkdir(exist_ok=True, parents=True)
            
            with open(features_file, 'w') as f:
                json.dump(combined_features, f, indent=2, default=float)
            
            logger.info(f"Extracted advanced visual features for persona {persona_id}")
            
        except Exception as e:
            logger.error(f"Error extracting advanced visual features: {e}")
    
    async def _extract_visual_features(self, frames_dir: Path, persona_id: str):
        """Extract visual characteristics from video frames"""
        try:
            if not VIDEO_PROCESSING_AVAILABLE:
                return
            
            # Placeholder for visual feature extraction
            # This would involve face detection, expression analysis, etc.
            features = {
                "facial_landmarks": [],
                "expressions": [],
                "pose_characteristics": [],
                "visual_style": {}
            }
            
            # Store visual features
            features_file = self.training_dir / persona_id / "visual_features.json"
            features_file.parent.mkdir(exist_ok=True, parents=True)
            
            import json
            with open(features_file, 'w') as f:
                json.dump(features, f, indent=2)
            
            logger.debug(f"Extracted visual features for persona {persona_id}")
            
        except Exception as e:
            logger.error(f"Error extracting visual features: {e}")
    
    async def _extract_personality_features(self, text_content: List[str], persona_id: str):
        """Extract personality traits from text content"""
        try:
            # Combine all text
            combined_text = " ".join(text_content)
            
            # Placeholder for advanced personality analysis
            # This would involve NLP analysis, sentiment analysis, etc.
            features = {
                "writing_style": {
                    "average_sentence_length": len(combined_text.split()) / max(1, len(combined_text.split('.'))),
                    "vocabulary_complexity": len(set(combined_text.lower().split())),
                    "punctuation_usage": combined_text.count('!') + combined_text.count('?')
                },
                "topics_discussed": [],
                "emotional_patterns": {},
                "communication_preferences": {}
            }
            
            # Store personality features
            features_file = self.training_dir / persona_id / "personality_features.json"
            features_file.parent.mkdir(exist_ok=True, parents=True)
            
            import json
            with open(features_file, 'w') as f:
                json.dump(features, f, indent=2)
            
            logger.debug(f"Extracted personality features for persona {persona_id}")
            
        except Exception as e:
            logger.error(f"Error extracting personality features: {e}")
    
    async def _extract_image_features(self, image, persona_id: str):
        """Extract features from individual images"""
        try:
            # Placeholder for image analysis
            # This would involve face recognition, style analysis, etc.
            features = {
                "color_palette": [],
                "style_elements": {},
                "facial_features": {}
            }
            
            logger.debug(f"Extracted image features for persona {persona_id}")
            
        except Exception as e:
            logger.error(f"Error extracting image features: {e}")
    
    async def _synthesize_persona_model(self, persona_id: str, training_dir: Path):
        """Synthesize all extracted features into a unified persona model"""
        try:
            import json
            
            model_data = {
                "persona_id": persona_id,
                "voice_model": {},
                "visual_model": {},
                "personality_model": {},
                "training_timestamp": datetime.now().isoformat()
            }
            
            # Load extracted features
            features_files = {
                "voice": training_dir / "voice_features.json",
                "visual": training_dir / "visual_features.json", 
                "personality": training_dir / "personality_features.json"
            }
            
            for feature_type, features_file in features_files.items():
                if features_file.exists():
                    with open(features_file, 'r') as f:
                        model_data[f"{feature_type}_model"] = json.load(f)
            
            # Save unified model
            model_file = self.training_dir / persona_id / "persona_model.json"
            with open(model_file, 'w') as f:
                json.dump(model_data, f, indent=2)
            
            logger.info(f"Synthesized persona model for {persona_id}")
            
        except Exception as e:
            logger.error(f"Error synthesizing persona model: {e}")
            raise
    
    def get_training_progress(self, persona_id: str) -> Optional[TrainingProgress]:
        """Get current training progress for a persona"""
        return self.active_trainings.get(persona_id)
    
    def cancel_training(self, persona_id: str) -> bool:
        """Cancel ongoing training for a persona"""
        if persona_id in self.active_trainings:
            self.active_trainings[persona_id].status = "cancelled"
            logger.info(f"Cancelled training for persona {persona_id}")
            return True
        return False