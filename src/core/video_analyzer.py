import cv2
import numpy as np
import json
import time
from pathlib import Path
from typing import Dict, List, Optional, Callable, Any, Tuple
from ..utils.logger import logger

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    logger.warning("MediaPipe not available - advanced video analysis disabled")
    MEDIAPIPE_AVAILABLE = False

try:
    import librosa
    import soundfile as sf
    AUDIO_PROCESSING_AVAILABLE = True
except ImportError:
    logger.warning("Audio processing libraries not available")
    AUDIO_PROCESSING_AVAILABLE = False

class VideoAnalyzer:
    """Advanced video analysis for persona training"""
    
    def __init__(self):
        # MediaPipe setup
        if MEDIAPIPE_AVAILABLE:
            self.mp_face_detection = mp.solutions.face_detection
            self.mp_pose = mp.solutions.pose
            self.mp_hands = mp.solutions.hands
            self.mp_face_mesh = mp.solutions.face_mesh
            self.mp_drawing = mp.solutions.drawing_utils
        
        # Analysis results storage
        self.analysis_results = {}
        
        logger.info("Video analyzer initialized")
    
    def analyze_video(self, video_path: str, progress_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """Comprehensive video analysis for persona training"""
        try:
            logger.info(f"Starting video analysis: {video_path}")
            
            if not Path(video_path).exists():
                raise FileNotFoundError(f"Video file not found: {video_path}")
            
            # Initialize results
            results = {
                "video_path": video_path,
                "analysis_timestamp": time.time(),
                "basic_info": {},
                "visual_features": {},
                "audio_features": {},
                "personality_indicators": {},
                "training_suitability": {}
            }
            
            # Basic video information
            if progress_callback:
                progress_callback(10, "Extracting basic video information...")
            
            basic_info = self._extract_basic_info(video_path)
            results["basic_info"] = basic_info
            
            # Extract audio for analysis
            if progress_callback:
                progress_callback(20, "Extracting audio track...")
            
            audio_path = self._extract_audio(video_path)
            if audio_path:
                results["audio_features"] = self._analyze_audio_features(audio_path)
            
            # Visual analysis
            if progress_callback:
                progress_callback(40, "Analyzing visual content...")
            
            visual_features = self._analyze_visual_features(video_path, progress_callback)
            results["visual_features"] = visual_features
            
            # Personality indicators
            if progress_callback:
                progress_callback(80, "Extracting personality indicators...")
            
            personality_indicators = self._extract_personality_indicators(results)
            results["personality_indicators"] = personality_indicators
            
            # Training suitability assessment
            if progress_callback:
                progress_callback(90, "Assessing training suitability...")
            
            suitability = self._assess_training_suitability(results)
            results["training_suitability"] = suitability
            
            if progress_callback:
                progress_callback(100, "Video analysis completed!")
            
            logger.info(f"Video analysis completed: {video_path}")
            return results
            
        except Exception as e:
            logger.error(f"Video analysis failed: {e}")
            if progress_callback:
                progress_callback(-1, f"Analysis failed: {e}")
            return {"error": str(e)}
    
    def _extract_basic_info(self, video_path: str) -> Dict[str, Any]:
        """Extract basic video information"""
        try:
            cap = cv2.VideoCapture(video_path)
            
            if not cap.isOpened():
                raise ValueError("Could not open video file")
            
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            cap.release()
            
            return {
                "duration": duration,
                "fps": fps,
                "frame_count": frame_count,
                "resolution": {"width": width, "height": height},
                "aspect_ratio": width / height if height > 0 else 0,
                "file_size": Path(video_path).stat().st_size
            }
            
        except Exception as e:
            logger.error(f"Failed to extract basic info: {e}")
            return {"error": str(e)}
    
    def _extract_audio(self, video_path: str) -> Optional[str]:
        """Extract audio track from video"""
        try:
            if not AUDIO_PROCESSING_AVAILABLE:
                logger.warning("Audio processing not available")
                return None
            
            # Use moviepy to extract audio
            try:
                from moviepy.editor import VideoFileClip
                
                video = VideoFileClip(video_path)
                audio = video.audio
                
                if audio is None:
                    logger.warning("No audio track found in video")
                    return None
                
                # Save extracted audio
                audio_path = str(Path(video_path).with_suffix('.wav'))
                audio.write_audiofile(audio_path, verbose=False, logger=None)
                
                video.close()
                audio.close()
                
                return audio_path
                
            except ImportError:
                logger.warning("MoviePy not available for audio extraction")
                return None
                
        except Exception as e:
            logger.error(f"Audio extraction failed: {e}")
            return None
    
    def _analyze_audio_features(self, audio_path: str) -> Dict[str, Any]:
        """Analyze audio features from extracted track"""
        try:
            if not AUDIO_PROCESSING_AVAILABLE:
                return {"error": "Audio processing not available"}
            
            # Load audio
            y, sr = librosa.load(audio_path, sr=22050)
            
            # Basic audio features
            duration = len(y) / sr
            rms_energy = librosa.feature.rms(y=y)[0]
            mean_energy = np.mean(rms_energy)
            
            # Spectral features
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            zero_crossing_rate = librosa.feature.zero_crossing_rate(y)[0]
            
            # MFCCs for voice characteristics
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            
            # Tempo and rhythm
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            
            # Voice activity detection
            voice_segments = self._detect_voice_activity(y, sr)
            
            return {
                "duration": duration,
                "mean_energy": float(mean_energy),
                "spectral_centroid_mean": float(np.mean(spectral_centroids)),
                "spectral_rolloff_mean": float(np.mean(spectral_rolloff)),
                "zero_crossing_rate_mean": float(np.mean(zero_crossing_rate)),
                "mfcc_features": mfccs.mean(axis=1).tolist(),
                "tempo": float(tempo),
                "voice_segments": voice_segments,
                "voice_activity_ratio": len(voice_segments) / duration if duration > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Audio feature analysis failed: {e}")
            return {"error": str(e)}
    
    def _detect_voice_activity(self, audio: np.ndarray, sr: int) -> List[Tuple[float, float]]:
        """Detect voice activity segments in audio"""
        try:
            # Simple energy-based voice activity detection
            frame_length = int(0.025 * sr)  # 25ms frames
            hop_length = int(0.010 * sr)    # 10ms hop
            
            # Compute frame energy
            frames = librosa.util.frame(audio, frame_length=frame_length, hop_length=hop_length)
            energy = np.sum(frames ** 2, axis=0)
            
            # Threshold for voice activity (top 30% energy)
            threshold = np.percentile(energy, 70)
            
            # Find voice segments
            voice_frames = energy > threshold
            segments = []
            
            start = None
            for i, is_voice in enumerate(voice_frames):
                time_pos = i * hop_length / sr
                
                if is_voice and start is None:
                    start = time_pos
                elif not is_voice and start is not None:
                    segments.append((start, time_pos))
                    start = None
            
            # Close last segment if needed
            if start is not None:
                segments.append((start, len(audio) / sr))
            
            return segments
            
        except Exception as e:
            logger.warning(f"Voice activity detection failed: {e}")
            return []
    
    def _analyze_visual_features(self, video_path: str, progress_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """Analyze visual features and body language"""
        try:
            if not MEDIAPIPE_AVAILABLE:
                return {"error": "MediaPipe not available for visual analysis"}
            
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError("Could not open video")
            
            # Initialize MediaPipe
            face_detection = self.mp_face_detection.FaceDetection(min_detection_confidence=0.5)
            pose = self.mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
            hands = self.mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)
            
            # Analysis results
            face_detections = []
            pose_landmarks = []
            hand_gestures = []
            emotion_indicators = []
            
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frame_skip = max(1, frame_count // 100)  # Analyze every Nth frame for efficiency
            
            frame_idx = 0
            analyzed_frames = 0
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_idx % frame_skip == 0:
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    
                    # Face detection
                    face_results = face_detection.process(rgb_frame)
                    if face_results.detections:
                        for detection in face_results.detections:
                            face_detections.append({
                                "confidence": detection.score[0],
                                "timestamp": frame_idx / cap.get(cv2.CAP_PROP_FPS)
                            })
                    
                    # Pose estimation
                    pose_results = pose.process(rgb_frame)
                    if pose_results.pose_landmarks:
                        pose_data = self._extract_pose_features(pose_results.pose_landmarks)
                        pose_data["timestamp"] = frame_idx / cap.get(cv2.CAP_PROP_FPS)
                        pose_landmarks.append(pose_data)
                    
                    # Hand tracking
                    hand_results = hands.process(rgb_frame)
                    if hand_results.multi_hand_landmarks:
                        for hand_landmarks in hand_results.multi_hand_landmarks:
                            hand_data = self._extract_hand_features(hand_landmarks)
                            hand_data["timestamp"] = frame_idx / cap.get(cv2.CAP_PROP_FPS)
                            hand_gestures.append(hand_data)
                    
                    analyzed_frames += 1
                    
                    # Update progress
                    if progress_callback and analyzed_frames % 10 == 0:
                        progress = 40 + int((frame_idx / frame_count) * 40)
                        progress_callback(progress, f"Analyzing frame {frame_idx}/{frame_count}...")
                
                frame_idx += 1
            
            cap.release()
            face_detection.close()
            pose.close()
            hands.close()
            
            # Compile results
            return {
                "analyzed_frames": analyzed_frames,
                "face_detection_rate": len(face_detections) / analyzed_frames if analyzed_frames > 0 else 0,
                "average_face_confidence": np.mean([f["confidence"] for f in face_detections]) if face_detections else 0,
                "pose_landmarks_count": len(pose_landmarks),
                "hand_gestures_count": len(hand_gestures),
                "movement_analysis": self._analyze_movement_patterns(pose_landmarks),
                "gesture_analysis": self._analyze_gesture_patterns(hand_gestures)
            }
            
        except Exception as e:
            logger.error(f"Visual feature analysis failed: {e}")
            return {"error": str(e)}
    
    def _extract_pose_features(self, landmarks) -> Dict[str, Any]:
        """Extract pose features from MediaPipe landmarks"""
        try:
            # Convert landmarks to numpy array
            pose_points = np.array([[lm.x, lm.y, lm.z] for lm in landmarks.landmark])
            
            # Calculate key pose metrics
            shoulder_width = np.linalg.norm(pose_points[11] - pose_points[12])  # Left-right shoulder
            body_height = np.linalg.norm(pose_points[0] - pose_points[29])      # Head to ankle
            
            # Body posture indicators
            spine_alignment = self._calculate_spine_alignment(pose_points)
            shoulder_level = abs(pose_points[11][1] - pose_points[12][1])  # Shoulder levelness
            
            return {
                "shoulder_width": float(shoulder_width),
                "body_height": float(body_height),
                "spine_alignment": float(spine_alignment),
                "shoulder_level": float(shoulder_level),
                "confidence_score": np.mean([lm.visibility for lm in landmarks.landmark])
            }
            
        except Exception as e:
            logger.warning(f"Pose feature extraction failed: {e}")
            return {}
    
    def _extract_hand_features(self, landmarks) -> Dict[str, Any]:
        """Extract hand gesture features"""
        try:
            # Convert landmarks to numpy array
            hand_points = np.array([[lm.x, lm.y, lm.z] for lm in landmarks.landmark])
            
            # Calculate hand metrics
            hand_span = np.linalg.norm(hand_points[4] - hand_points[20])  # Thumb to pinky
            finger_spread = self._calculate_finger_spread(hand_points)
            
            # Gesture classification (simplified)
            gesture_type = self._classify_basic_gesture(hand_points)
            
            return {
                "hand_span": float(hand_span),
                "finger_spread": float(finger_spread),
                "gesture_type": gesture_type,
                "activity_level": float(np.std(hand_points))
            }
            
        except Exception as e:
            logger.warning(f"Hand feature extraction failed: {e}")
            return {}
    
    def _calculate_spine_alignment(self, pose_points: np.ndarray) -> float:
        """Calculate spine alignment score"""
        try:
            # Use key spine points (simplified)
            head = pose_points[0]
            neck = (pose_points[11] + pose_points[12]) / 2  # Average of shoulders
            hip = (pose_points[23] + pose_points[24]) / 2   # Average of hips
            
            # Calculate deviation from vertical line
            spine_vector = head - hip
            vertical_vector = np.array([0, -1, 0])
            
            # Alignment score (1 = perfect alignment, 0 = completely misaligned)
            alignment = np.dot(spine_vector[:2], vertical_vector[:2]) / (
                np.linalg.norm(spine_vector[:2]) * np.linalg.norm(vertical_vector[:2]) + 1e-10
            )
            
            return max(0, alignment)
            
        except Exception:
            return 0.5  # Default neutral alignment
    
    def _calculate_finger_spread(self, hand_points: np.ndarray) -> float:
        """Calculate finger spread metric"""
        try:
            # Finger tip indices in MediaPipe
            finger_tips = [4, 8, 12, 16, 20]  # Thumb, index, middle, ring, pinky
            
            # Calculate average distance between adjacent fingers
            distances = []
            for i in range(len(finger_tips) - 1):
                dist = np.linalg.norm(hand_points[finger_tips[i]] - hand_points[finger_tips[i+1]])
                distances.append(dist)
            
            return np.mean(distances) if distances else 0
            
        except Exception:
            return 0
    
    def _classify_basic_gesture(self, hand_points: np.ndarray) -> str:
        """Basic gesture classification"""
        try:
            # Simple heuristics for common gestures
            thumb_tip = hand_points[4]
            index_tip = hand_points[8]
            middle_tip = hand_points[12]
            ring_tip = hand_points[16]
            pinky_tip = hand_points[20]
            
            wrist = hand_points[0]
            
            # Check if fingers are extended (above wrist level)
            fingers_up = []
            for tip in [thumb_tip, index_tip, middle_tip, ring_tip, pinky_tip]:
                fingers_up.append(tip[1] < wrist[1])  # Y coordinate decreases upward
            
            # Simple gesture classification
            up_count = sum(fingers_up)
            
            if up_count == 0:
                return "fist"
            elif up_count == 1:
                return "pointing"
            elif up_count == 2:
                return "peace_sign"
            elif up_count == 5:
                return "open_hand"
            else:
                return "partial_gesture"
                
        except Exception:
            return "unknown"
    
    def _analyze_movement_patterns(self, pose_data: List[Dict]) -> Dict[str, Any]:
        """Analyze movement patterns from pose data"""
        try:
            if len(pose_data) < 2:
                return {"error": "Insufficient pose data"}
            
            # Calculate movement metrics
            movements = []
            for i in range(1, len(pose_data)):
                if "shoulder_width" in pose_data[i] and "shoulder_width" in pose_data[i-1]:
                    # Simple movement metric based on pose changes
                    movement = abs(pose_data[i]["shoulder_width"] - pose_data[i-1]["shoulder_width"])
                    movements.append(movement)
            
            if not movements:
                return {"error": "No movement data"}
            
            return {
                "average_movement": float(np.mean(movements)),
                "movement_variability": float(np.std(movements)),
                "total_movement": float(np.sum(movements)),
                "movement_peaks": len([m for m in movements if m > np.mean(movements) + np.std(movements)])
            }
            
        except Exception as e:
            logger.warning(f"Movement analysis failed: {e}")
            return {"error": str(e)}
    
    def _analyze_gesture_patterns(self, hand_data: List[Dict]) -> Dict[str, Any]:
        """Analyze gesture patterns from hand data"""
        try:
            if not hand_data:
                return {"no_gestures": True}
            
            # Count gesture types
            gesture_counts = {}
            activity_levels = []
            
            for gesture in hand_data:
                if "gesture_type" in gesture:
                    gesture_type = gesture["gesture_type"]
                    gesture_counts[gesture_type] = gesture_counts.get(gesture_type, 0) + 1
                
                if "activity_level" in gesture:
                    activity_levels.append(gesture["activity_level"])
            
            return {
                "gesture_types": gesture_counts,
                "most_common_gesture": max(gesture_counts.items(), key=lambda x: x[1])[0] if gesture_counts else "none",
                "gesture_variety": len(gesture_counts),
                "average_activity": float(np.mean(activity_levels)) if activity_levels else 0,
                "gesture_frequency": len(hand_data) / (hand_data[-1]["timestamp"] - hand_data[0]["timestamp"]) if len(hand_data) > 1 and "timestamp" in hand_data[0] else 0
            }
            
        except Exception as e:
            logger.warning(f"Gesture analysis failed: {e}")
            return {"error": str(e)}
    
    def _extract_personality_indicators(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Extract personality indicators from analysis results"""
        try:
            indicators = {}
            
            # Energy level from audio
            if "audio_features" in analysis_results:
                audio = analysis_results["audio_features"]
                if "mean_energy" in audio:
                    energy_level = min(1.0, audio["mean_energy"] * 10)
                    indicators["energy_level"] = float(energy_level)
                
                if "tempo" in audio:
                    speaking_pace = "slow" if audio["tempo"] < 100 else "fast" if audio["tempo"] > 150 else "moderate"
                    indicators["speaking_pace"] = speaking_pace
            
            # Confidence from visual analysis
            if "visual_features" in analysis_results:
                visual = analysis_results["visual_features"]
                if "average_face_confidence" in visual:
                    indicators["visual_confidence"] = float(visual["average_face_confidence"])
                
                if "movement_analysis" in visual and isinstance(visual["movement_analysis"], dict):
                    movement = visual["movement_analysis"]
                    if "average_movement" in movement:
                        expressiveness = min(1.0, movement["average_movement"] * 100)
                        indicators["expressiveness"] = float(expressiveness)
            
            # Engagement level
            basic_info = analysis_results.get("basic_info", {})
            if "duration" in basic_info:
                duration = basic_info["duration"]
                engagement_score = min(1.0, duration / 60)  # Normalize to 1 minute
                indicators["engagement_duration"] = float(engagement_score)
            
            return indicators
            
        except Exception as e:
            logger.warning(f"Personality indicator extraction failed: {e}")
            return {}
    
    def _assess_training_suitability(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Assess video suitability for persona training"""
        try:
            suitability = {
                "overall_score": 0,
                "recommendations": [],
                "issues": [],
                "strengths": []
            }
            
            score = 0
            max_score = 0
            
            # Duration check
            basic_info = analysis_results.get("basic_info", {})
            if "duration" in basic_info:
                duration = basic_info["duration"]
                max_score += 20
                
                if duration < 10:
                    suitability["issues"].append("Video too short (minimum 10 seconds recommended)")
                    score += 5
                elif duration < 30:
                    suitability["recommendations"].append("Longer videos (30+ seconds) provide better training data")
                    score += 15
                else:
                    suitability["strengths"].append("Good video duration for training")
                    score += 20
            
            # Audio quality check
            audio_features = analysis_results.get("audio_features", {})
            if "mean_energy" in audio_features:
                max_score += 20
                energy = audio_features["mean_energy"]
                
                if energy < 0.01:
                    suitability["issues"].append("Audio level very low - may affect voice training")
                    score += 5
                elif energy < 0.05:
                    suitability["recommendations"].append("Audio could be louder for better voice training")
                    score += 15
                else:
                    suitability["strengths"].append("Good audio levels detected")
                    score += 20
            
            # Visual quality check
            visual_features = analysis_results.get("visual_features", {})
            if "face_detection_rate" in visual_features:
                max_score += 20
                face_rate = visual_features["face_detection_rate"]
                
                if face_rate < 0.3:
                    suitability["issues"].append("Face not consistently visible - affects visual training")
                    score += 5
                elif face_rate < 0.7:
                    suitability["recommendations"].append("Face should be visible more consistently")
                    score += 15
                else:
                    suitability["strengths"].append("Face consistently visible throughout video")
                    score += 20
            
            # Voice activity check
            if "voice_activity_ratio" in audio_features:
                max_score += 20
                voice_ratio = audio_features["voice_activity_ratio"]
                
                if voice_ratio < 0.3:
                    suitability["issues"].append("Limited voice activity detected")
                    score += 5
                elif voice_ratio < 0.6:
                    suitability["recommendations"].append("More continuous speech would improve training")
                    score += 15
                else:
                    suitability["strengths"].append("Good voice activity throughout video")
                    score += 20
            
            # Movement and expressiveness
            if "movement_analysis" in visual_features and isinstance(visual_features["movement_analysis"], dict):
                max_score += 20
                movement = visual_features["movement_analysis"]
                
                if "average_movement" in movement:
                    avg_movement = movement["average_movement"]
                    
                    if avg_movement < 0.001:
                        suitability["recommendations"].append("More natural movement would enhance persona character")
                        score += 10
                    else:
                        suitability["strengths"].append("Natural movement patterns detected")
                        score += 20
            
            # Calculate overall score
            if max_score > 0:
                suitability["overall_score"] = min(100, (score / max_score) * 100)
            
            # Overall recommendations
            if suitability["overall_score"] >= 80:
                suitability["verdict"] = "Excellent for training"
            elif suitability["overall_score"] >= 60:
                suitability["verdict"] = "Good for training"
            elif suitability["overall_score"] >= 40:
                suitability["verdict"] = "Acceptable for training"
            else:
                suitability["verdict"] = "Poor quality - consider re-recording"
            
            return suitability
            
        except Exception as e:
            logger.error(f"Training suitability assessment failed: {e}")
            return {
                "overall_score": 0,
                "verdict": "Analysis failed",
                "error": str(e)
            }
    
    def extract_training_clips(self, video_path: str, analysis_results: Dict[str, Any], output_dir: str) -> List[str]:
        """Extract high-quality clips for training from analyzed video"""
        try:
            logger.info(f"Extracting training clips from: {video_path}")
            
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Identify good segments based on analysis
            good_segments = self._identify_training_segments(analysis_results)
            
            if not good_segments:
                logger.warning("No suitable training segments found")
                return []
            
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError("Could not open video")
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            extracted_clips = []
            
            for i, (start_time, end_time) in enumerate(good_segments):
                # Extract clip
                start_frame = int(start_time * fps)
                end_frame = int(end_time * fps)
                
                clip_path = output_path / f"training_clip_{i+1:02d}.mp4"
                
                # Use OpenCV to extract clip
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                out = cv2.VideoWriter(str(clip_path), fourcc, fps, 
                                    (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), 
                                     int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))))
                
                cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
                
                for frame_idx in range(start_frame, min(end_frame, int(cap.get(cv2.CAP_PROP_FRAME_COUNT)))):
                    ret, frame = cap.read()
                    if not ret:
                        break
                    out.write(frame)
                
                out.release()
                extracted_clips.append(str(clip_path))
                
                logger.info(f"Extracted clip: {clip_path} ({start_time:.1f}s - {end_time:.1f}s)")
            
            cap.release()
            
            return extracted_clips
            
        except Exception as e:
            logger.error(f"Training clip extraction failed: {e}")
            return []
    
    def _identify_training_segments(self, analysis_results: Dict[str, Any]) -> List[Tuple[float, float]]:
        """Identify good segments for training based on analysis"""
        try:
            segments = []
            
            # Get voice activity segments if available
            audio_features = analysis_results.get("audio_features", {})
            if "voice_segments" in audio_features:
                voice_segments = audio_features["voice_segments"]
                
                # Filter segments by minimum duration and merge close ones
                min_duration = 5.0  # 5 seconds minimum
                max_gap = 2.0      # 2 seconds maximum gap to merge
                
                filtered_segments = []
                for start, end in voice_segments:
                    if end - start >= min_duration:
                        filtered_segments.append([start, end])
                
                # Merge close segments
                if filtered_segments:
                    merged_segments = [filtered_segments[0]]
                    
                    for current in filtered_segments[1:]:
                        last = merged_segments[-1]
                        
                        if current[0] - last[1] <= max_gap:
                            # Merge segments
                            last[1] = current[1]
                        else:
                            merged_segments.append(current)
                    
                    segments = [(start, end) for start, end in merged_segments]
            
            # If no voice segments, use full video in chunks
            if not segments:
                basic_info = analysis_results.get("basic_info", {})
                if "duration" in basic_info:
                    duration = basic_info["duration"]
                    chunk_size = 30.0  # 30-second chunks
                    
                    for start in range(0, int(duration), int(chunk_size)):
                        end = min(start + chunk_size, duration)
                        if end - start >= 10:  # At least 10 seconds
                            segments.append((start, end))
            
            return segments
            
        except Exception as e:
            logger.warning(f"Training segment identification failed: {e}")
            return []