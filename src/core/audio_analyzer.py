import numpy as np
import json
import time
from pathlib import Path
from typing import Dict, List, Optional, Callable, Any, Tuple
from ..utils.logger import logger

try:
    import librosa
    import soundfile as sf
    LIBROSA_AVAILABLE = True
except ImportError:
    logger.warning("Librosa not available - audio analysis disabled")
    LIBROSA_AVAILABLE = False

try:
    import scipy.signal
    import scipy.fft
    SCIPY_AVAILABLE = True
except ImportError:
    logger.warning("SciPy not available - advanced audio analysis disabled")
    SCIPY_AVAILABLE = False

try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    logger.warning("TextBlob not available - sentiment analysis disabled")
    TEXTBLOB_AVAILABLE = False

class AudioAnalyzer:
    """Advanced audio analysis for persona training and voice characteristics"""
    
    def __init__(self):
        self.sample_rate = 22050
        self.n_mfcc = 13
        self.n_mel = 128
        
        # Audio feature cache
        self.feature_cache = {}
        
        logger.info("Audio analyzer initialized")
    
    def analyze_audio(self, audio_path: str, progress_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """Comprehensive audio analysis for persona training"""
        try:
            logger.info(f"Starting audio analysis: {audio_path}")
            
            if not LIBROSA_AVAILABLE:
                return {"error": "Audio analysis libraries not available"}
            
            if not Path(audio_path).exists():
                raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
            # Initialize results
            results = {
                "audio_path": audio_path,
                "analysis_timestamp": time.time(),
                "basic_info": {},
                "spectral_features": {},
                "prosodic_features": {},
                "voice_characteristics": {},
                "emotional_indicators": {},
                "training_suitability": {},
                "voice_quality": {}
            }
            
            if progress_callback:
                progress_callback(10, "Loading audio file...")
            
            # Load audio
            y, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Basic information
            if progress_callback:
                progress_callback(20, "Extracting basic information...")
            
            basic_info = self._extract_basic_info(y, sr, audio_path)
            results["basic_info"] = basic_info
            
            # Spectral features
            if progress_callback:
                progress_callback(35, "Analyzing spectral features...")
            
            spectral_features = self._extract_spectral_features(y, sr)
            results["spectral_features"] = spectral_features
            
            # Prosodic features (rhythm, tempo, stress)
            if progress_callback:
                progress_callback(50, "Analyzing prosodic features...")
            
            prosodic_features = self._extract_prosodic_features(y, sr)
            results["prosodic_features"] = prosodic_features
            
            # Voice characteristics
            if progress_callback:
                progress_callback(65, "Analyzing voice characteristics...")
            
            voice_characteristics = self._extract_voice_characteristics(y, sr)
            results["voice_characteristics"] = voice_characteristics
            
            # Emotional indicators
            if progress_callback:
                progress_callback(80, "Analyzing emotional indicators...")
            
            emotional_indicators = self._extract_emotional_indicators(y, sr)
            results["emotional_indicators"] = emotional_indicators
            
            # Voice quality assessment
            if progress_callback:
                progress_callback(90, "Assessing voice quality...")
            
            voice_quality = self._assess_voice_quality(y, sr)
            results["voice_quality"] = voice_quality
            
            # Training suitability assessment
            if progress_callback:
                progress_callback(95, "Assessing training suitability...")
            
            training_suitability = self._assess_training_suitability(results)
            results["training_suitability"] = training_suitability
            
            if progress_callback:
                progress_callback(100, "Audio analysis completed!")
            
            logger.info(f"Audio analysis completed: {audio_path}")
            return results
            
        except Exception as e:
            logger.error(f"Audio analysis failed: {e}")
            if progress_callback:
                progress_callback(-1, f"Analysis failed: {e}")
            return {"error": str(e)}
    
    def _extract_basic_info(self, y: np.ndarray, sr: int, audio_path: str) -> Dict[str, Any]:
        """Extract basic audio information"""
        try:
            duration = len(y) / sr
            file_size = Path(audio_path).stat().st_size
            
            # RMS energy
            rms = librosa.feature.rms(y=y)[0]
            mean_energy = float(np.mean(rms))
            max_energy = float(np.max(rms))
            
            # Zero crossing rate
            zcr = librosa.feature.zero_crossing_rate(y)[0]
            mean_zcr = float(np.mean(zcr))
            
            # Dynamic range
            dynamic_range = float(np.max(np.abs(y)) - np.min(np.abs(y)))
            
            return {
                "duration": duration,
                "sample_rate": sr,
                "file_size": file_size,
                "mean_energy": mean_energy,
                "max_energy": max_energy,
                "dynamic_range": dynamic_range,
                "mean_zero_crossing_rate": mean_zcr,
                "total_samples": len(y)
            }
            
        except Exception as e:
            logger.error(f"Basic info extraction failed: {e}")
            return {"error": str(e)}
    
    def _extract_spectral_features(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """Extract spectral features"""
        try:
            # MFCCs
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=self.n_mfcc)
            mfcc_means = mfccs.mean(axis=1).tolist()
            mfcc_stds = mfccs.std(axis=1).tolist()
            
            # Spectral centroid
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            centroid_mean = float(np.mean(spectral_centroids))
            centroid_std = float(np.std(spectral_centroids))
            
            # Spectral rolloff
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            rolloff_mean = float(np.mean(spectral_rolloff))
            
            # Spectral bandwidth
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
            bandwidth_mean = float(np.mean(spectral_bandwidth))
            
            # Spectral contrast
            spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
            contrast_mean = spectral_contrast.mean(axis=1).tolist()
            
            # Chroma features
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            chroma_mean = chroma.mean(axis=1).tolist()
            
            # Tonnetz (harmonic network)
            tonnetz = librosa.feature.tonnetz(y=librosa.effects.harmonic(y), sr=sr)
            tonnetz_mean = tonnetz.mean(axis=1).tolist()
            
            return {
                "mfcc_means": mfcc_means,
                "mfcc_stds": mfcc_stds,
                "spectral_centroid_mean": centroid_mean,
                "spectral_centroid_std": centroid_std,
                "spectral_rolloff_mean": rolloff_mean,
                "spectral_bandwidth_mean": bandwidth_mean,
                "spectral_contrast_mean": contrast_mean,
                "chroma_mean": chroma_mean,
                "tonnetz_mean": tonnetz_mean
            }
            
        except Exception as e:
            logger.error(f"Spectral feature extraction failed: {e}")
            return {"error": str(e)}
    
    def _extract_prosodic_features(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """Extract prosodic features (rhythm, tempo, stress patterns)"""
        try:
            # Tempo and beat tracking
            tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
            
            # Rhythm patterns
            onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
            onset_times = librosa.frames_to_time(onset_frames, sr=sr)
            
            # Inter-onset intervals (timing between speech events)
            if len(onset_times) > 1:
                onset_intervals = np.diff(onset_times)
                rhythm_regularity = float(1.0 / (np.std(onset_intervals) + 1e-10))
                mean_onset_interval = float(np.mean(onset_intervals))
            else:
                rhythm_regularity = 0.0
                mean_onset_interval = 0.0
            
            # Pitch tracking
            f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
            
            # Remove NaN values
            f0_clean = f0[~np.isnan(f0)]
            
            if len(f0_clean) > 0:
                pitch_mean = float(np.mean(f0_clean))
                pitch_std = float(np.std(f0_clean))
                pitch_range = float(np.max(f0_clean) - np.min(f0_clean))
                voiced_ratio = float(np.mean(voiced_flag))
            else:
                pitch_mean = 0.0
                pitch_std = 0.0
                pitch_range = 0.0
                voiced_ratio = 0.0
            
            # Speech rate estimation
            voiced_frames = np.sum(voiced_flag)
            duration = len(y) / sr
            speech_rate = float(voiced_frames / (duration * sr / 512))  # Frames per second
            
            return {
                "tempo": float(tempo),
                "rhythm_regularity": rhythm_regularity,
                "mean_onset_interval": mean_onset_interval,
                "onset_count": len(onset_times),
                "pitch_mean": pitch_mean,
                "pitch_std": pitch_std,
                "pitch_range": pitch_range,
                "voiced_ratio": voiced_ratio,
                "speech_rate": speech_rate
            }
            
        except Exception as e:
            logger.error(f"Prosodic feature extraction failed: {e}")
            return {"error": str(e)}
    
    def _extract_voice_characteristics(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """Extract voice characteristics for persona identification"""
        try:
            # Formant analysis (vocal tract characteristics)
            formants = self._estimate_formants(y, sr)
            
            # Jitter and shimmer (voice quality measures)
            jitter, shimmer = self._calculate_jitter_shimmer(y, sr)
            
            # Harmonics-to-noise ratio
            hnr = self._calculate_hnr(y, sr)
            
            # Voice timbre features
            timbre_features = self._extract_timbre_features(y, sr)
            
            # Speaking style indicators
            style_indicators = self._analyze_speaking_style(y, sr)
            
            return {
                "formants": formants,
                "jitter": jitter,
                "shimmer": shimmer,
                "harmonics_to_noise_ratio": hnr,
                "timbre_features": timbre_features,
                "speaking_style": style_indicators
            }
            
        except Exception as e:
            logger.error(f"Voice characteristics extraction failed: {e}")
            return {"error": str(e)}
    
    def _estimate_formants(self, y: np.ndarray, sr: int) -> Dict[str, float]:
        """Estimate formant frequencies"""
        try:
            # Use LPC to estimate formants
            frame_length = 2048
            hop_length = 512
            
            # Voiced segments only
            f0, voiced_flag, _ = librosa.pyin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
            
            # Get formants for voiced segments
            formant_estimates = []
            
            for i in range(0, len(y) - frame_length, hop_length):
                frame = y[i:i+frame_length]
                frame_idx = i // hop_length
                
                if frame_idx < len(voiced_flag) and voiced_flag[frame_idx]:
                    # Apply window
                    windowed = frame * np.hanning(len(frame))
                    
                    # Pre-emphasis
                    pre_emphasized = np.append(windowed[0], windowed[1:] - 0.95 * windowed[:-1])
                    
                    # LPC analysis
                    try:
                        if SCIPY_AVAILABLE:
                            lpc_coeffs = scipy.signal.lfilter([1], [1, -0.95], pre_emphasized)
                            
                            # Find formants from LPC roots (simplified)
                            roots = np.roots(lpc_coeffs[:10])  # Use first 10 coefficients
                            angles = np.angle(roots[np.imag(roots) >= 0])
                            formant_freqs = angles * sr / (2 * np.pi)
                            formant_freqs = formant_freqs[formant_freqs > 0]
                            
                            if len(formant_freqs) >= 2:
                                formant_estimates.append(sorted(formant_freqs)[:3])  # First 3 formants
                    except:
                        continue
            
            if formant_estimates:
                formant_array = np.array(formant_estimates)
                
                return {
                    "f1_mean": float(np.mean(formant_array[:, 0])) if formant_array.shape[1] > 0 else 0.0,
                    "f2_mean": float(np.mean(formant_array[:, 1])) if formant_array.shape[1] > 1 else 0.0,
                    "f3_mean": float(np.mean(formant_array[:, 2])) if formant_array.shape[1] > 2 else 0.0,
                }
            else:
                return {"f1_mean": 0.0, "f2_mean": 0.0, "f3_mean": 0.0}
                
        except Exception as e:
            logger.warning(f"Formant estimation failed: {e}")
            return {"f1_mean": 0.0, "f2_mean": 0.0, "f3_mean": 0.0}
    
    def _calculate_jitter_shimmer(self, y: np.ndarray, sr: int) -> Tuple[float, float]:
        """Calculate jitter and shimmer measures"""
        try:
            # Get pitch periods
            f0, voiced_flag, _ = librosa.pyin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
            
            # Calculate periods from fundamental frequency
            periods = sr / f0[~np.isnan(f0)]
            
            if len(periods) < 3:
                return 0.0, 0.0
            
            # Jitter (period variation)
            period_diffs = np.abs(np.diff(periods))
            jitter = float(np.mean(period_diffs) / np.mean(periods)) if np.mean(periods) > 0 else 0.0
            
            # Shimmer (amplitude variation) - simplified
            rms = librosa.feature.rms(y=y, frame_length=512, hop_length=256)[0]
            rms_diffs = np.abs(np.diff(rms))
            shimmer = float(np.mean(rms_diffs) / np.mean(rms)) if np.mean(rms) > 0 else 0.0
            
            return jitter, shimmer
            
        except Exception as e:
            logger.warning(f"Jitter/shimmer calculation failed: {e}")
            return 0.0, 0.0
    
    def _calculate_hnr(self, y: np.ndarray, sr: int) -> float:
        """Calculate harmonics-to-noise ratio"""
        try:
            # Get harmonic and percussive components
            y_harmonic, y_percussive = librosa.effects.hpss(y)
            
            # Calculate power of each component
            harmonic_power = np.mean(y_harmonic ** 2)
            percussive_power = np.mean(y_percussive ** 2)
            
            # HNR in dB
            if percussive_power > 0:
                hnr = 10 * np.log10(harmonic_power / percussive_power)
            else:
                hnr = 40.0  # High HNR if no noise
            
            return float(hnr)
            
        except Exception as e:
            logger.warning(f"HNR calculation failed: {e}")
            return 0.0
    
    def _extract_timbre_features(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """Extract timbre-related features"""
        try:
            # Mel-frequency cepstral coefficients
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            
            # Spectral features for timbre
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            
            # Spectral flatness (measure of noisiness)
            spectral_flatness = librosa.feature.spectral_flatness(y=y)[0]
            
            return {
                "mfcc_variance": float(np.var(mfccs)),
                "spectral_centroid_mean": float(np.mean(spectral_centroid)),
                "spectral_bandwidth_mean": float(np.mean(spectral_bandwidth)),
                "spectral_rolloff_mean": float(np.mean(spectral_rolloff)),
                "spectral_flatness_mean": float(np.mean(spectral_flatness)),
                "timbre_complexity": float(np.std(mfccs))
            }
            
        except Exception as e:
            logger.warning(f"Timbre feature extraction failed: {e}")
            return {"error": str(e)}
    
    def _analyze_speaking_style(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """Analyze speaking style characteristics"""
        try:
            # Pause analysis
            pause_info = self._analyze_pauses(y, sr)
            
            # Volume dynamics
            rms = librosa.feature.rms(y=y)[0]
            volume_variance = float(np.var(rms))
            volume_range = float(np.max(rms) - np.min(rms))
            
            # Speech rate variation
            onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
            onset_times = librosa.frames_to_time(onset_frames, sr=sr)
            
            if len(onset_times) > 2:
                intervals = np.diff(onset_times)
                rate_consistency = float(1.0 / (np.std(intervals) + 1e-10))
            else:
                rate_consistency = 0.0
            
            # Articulation clarity (based on spectral clarity)
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            articulation_score = float(np.mean(spectral_centroid) / 1000)  # Normalized
            
            return {
                "pause_patterns": pause_info,
                "volume_variance": volume_variance,
                "volume_range": volume_range,
                "rate_consistency": rate_consistency,
                "articulation_clarity": articulation_score
            }
            
        except Exception as e:
            logger.warning(f"Speaking style analysis failed: {e}")
            return {"error": str(e)}
    
    def _analyze_pauses(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """Analyze pause patterns in speech"""
        try:
            # Detect silence/pause regions
            silence_threshold = np.percentile(np.abs(y), 20)  # Bottom 20% as silence
            
            # Find silent regions
            silent_frames = np.abs(y) < silence_threshold
            
            # Group consecutive silent frames
            pauses = []
            in_pause = False
            pause_start = 0
            
            for i, is_silent in enumerate(silent_frames):
                if is_silent and not in_pause:
                    in_pause = True
                    pause_start = i
                elif not is_silent and in_pause:
                    in_pause = False
                    pause_duration = (i - pause_start) / sr
                    if pause_duration > 0.1:  # Minimum 100ms pause
                        pauses.append(pause_duration)
            
            if pauses:
                return {
                    "total_pauses": len(pauses),
                    "average_pause_duration": float(np.mean(pauses)),
                    "pause_duration_std": float(np.std(pauses)),
                    "longest_pause": float(np.max(pauses)),
                    "pause_frequency": len(pauses) / (len(y) / sr)  # Pauses per second
                }
            else:
                return {
                    "total_pauses": 0,
                    "average_pause_duration": 0.0,
                    "pause_duration_std": 0.0,
                    "longest_pause": 0.0,
                    "pause_frequency": 0.0
                }
                
        except Exception as e:
            logger.warning(f"Pause analysis failed: {e}")
            return {"error": str(e)}
    
    def _extract_emotional_indicators(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """Extract emotional indicators from audio"""
        try:
            # Energy-based emotion indicators
            rms = librosa.feature.rms(y=y)[0]
            energy_mean = float(np.mean(rms))
            energy_variance = float(np.var(rms))
            
            # Pitch-based emotion indicators
            f0, voiced_flag, _ = librosa.pyin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
            f0_clean = f0[~np.isnan(f0)]
            
            if len(f0_clean) > 0:
                pitch_variance = float(np.var(f0_clean))
                pitch_range = float(np.max(f0_clean) - np.min(f0_clean))
            else:
                pitch_variance = 0.0
                pitch_range = 0.0
            
            # Spectral characteristics associated with emotion
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            
            brightness = float(np.mean(spectral_centroid))
            spectral_slope = float(np.mean(spectral_rolloff - spectral_centroid))
            
            # Emotional classification (simplified)
            emotion_scores = self._classify_emotion_indicators(
                energy_mean, energy_variance, pitch_variance, pitch_range, brightness
            )
            
            return {
                "energy_level": energy_mean,
                "energy_variation": energy_variance,
                "pitch_variation": pitch_variance,
                "pitch_range": pitch_range,
                "voice_brightness": brightness,
                "spectral_slope": spectral_slope,
                "emotion_indicators": emotion_scores
            }
            
        except Exception as e:
            logger.warning(f"Emotional indicator extraction failed: {e}")
            return {"error": str(e)}
    
    def _classify_emotion_indicators(self, energy: float, energy_var: float, 
                                   pitch_var: float, pitch_range: float, brightness: float) -> Dict[str, float]:
        """Simple emotion classification based on acoustic features"""
        try:
            # Normalize features (simplified approach)
            energy_norm = min(1.0, energy * 10)
            energy_var_norm = min(1.0, energy_var * 100)
            pitch_var_norm = min(1.0, pitch_var / 1000)
            pitch_range_norm = min(1.0, pitch_range / 200)
            brightness_norm = min(1.0, brightness / 2000)
            
            # Simple heuristic-based emotion indicators
            excitement = (energy_norm + pitch_var_norm + brightness_norm) / 3
            calmness = 1.0 - excitement
            expressiveness = (energy_var_norm + pitch_range_norm) / 2
            confidence = (energy_norm + brightness_norm) / 2
            
            return {
                "excitement": float(excitement),
                "calmness": float(calmness),
                "expressiveness": float(expressiveness),
                "confidence": float(confidence)
            }
            
        except Exception as e:
            logger.warning(f"Emotion classification failed: {e}")
            return {
                "excitement": 0.5,
                "calmness": 0.5,
                "expressiveness": 0.5,
                "confidence": 0.5
            }
    
    def _assess_voice_quality(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """Assess overall voice quality for training"""
        try:
            # Signal-to-noise ratio estimation
            signal_power = np.mean(y ** 2)
            noise_floor = np.percentile(np.abs(y), 10)
            snr = 10 * np.log10(signal_power / (noise_floor ** 2 + 1e-10))
            
            # Dynamic range
            dynamic_range = 20 * np.log10(np.max(np.abs(y)) / (np.mean(np.abs(y)) + 1e-10))
            
            # Frequency response quality
            freqs = np.fft.fftfreq(len(y), 1/sr)
            magnitude = np.abs(np.fft.fft(y))
            
            # Check for frequency balance (speech typically 80Hz - 8kHz)
            speech_range_mask = (freqs >= 80) & (freqs <= 8000) & (freqs > 0)
            speech_energy = np.sum(magnitude[speech_range_mask])
            total_energy = np.sum(magnitude[freqs > 0])
            
            frequency_balance = speech_energy / (total_energy + 1e-10)
            
            # Clipping detection
            clipping_threshold = 0.95
            clipped_samples = np.sum(np.abs(y) >= clipping_threshold)
            clipping_ratio = clipped_samples / len(y)
            
            # Overall quality score
            quality_components = {
                "snr_score": min(1.0, max(0.0, (snr - 10) / 30)),  # 10-40 dB range
                "dynamic_range_score": min(1.0, max(0.0, dynamic_range / 40)),  # 0-40 dB range
                "frequency_balance_score": float(frequency_balance),
                "clipping_penalty": max(0.0, 1.0 - clipping_ratio * 10)  # Penalty for clipping
            }
            
            overall_quality = np.mean(list(quality_components.values()))
            
            return {
                "snr_db": float(snr),
                "dynamic_range_db": float(dynamic_range),
                "frequency_balance": float(frequency_balance),
                "clipping_ratio": float(clipping_ratio),
                "quality_components": quality_components,
                "overall_quality_score": float(overall_quality),
                "quality_grade": self._grade_quality(overall_quality)
            }
            
        except Exception as e:
            logger.warning(f"Voice quality assessment failed: {e}")
            return {"error": str(e)}
    
    def _grade_quality(self, score: float) -> str:
        """Convert quality score to grade"""
        if score >= 0.8:
            return "Excellent"
        elif score >= 0.6:
            return "Good"
        elif score >= 0.4:
            return "Fair"
        elif score >= 0.2:
            return "Poor"
        else:
            return "Very Poor"
    
    def _assess_training_suitability(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Assess audio suitability for voice training"""
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
                
                if duration < 5:
                    suitability["issues"].append("Audio too short (minimum 5 seconds)")
                    score += 5
                elif duration < 30:
                    suitability["recommendations"].append("Longer audio (30+ seconds) improves training quality")
                    score += 15
                else:
                    suitability["strengths"].append("Good duration for voice training")
                    score += 20
            
            # Voice quality check
            voice_quality = analysis_results.get("voice_quality", {})
            if "overall_quality_score" in voice_quality:
                max_score += 25
                quality_score = voice_quality["overall_quality_score"]
                
                if quality_score < 0.3:
                    suitability["issues"].append("Poor audio quality - consider re-recording")
                    score += 5
                elif quality_score < 0.6:
                    suitability["recommendations"].append("Audio quality could be improved")
                    score += 15
                else:
                    suitability["strengths"].append("Good audio quality")
                    score += 25
            
            # SNR check
            if "snr_db" in voice_quality:
                max_score += 20
                snr = voice_quality["snr_db"]
                
                if snr < 10:
                    suitability["issues"].append("High background noise - record in quiet environment")
                    score += 5
                elif snr < 20:
                    suitability["recommendations"].append("Reduce background noise for better results")
                    score += 15
                else:
                    suitability["strengths"].append("Low background noise")
                    score += 20
            
            # Clipping check
            if "clipping_ratio" in voice_quality:
                max_score += 15
                clipping = voice_quality["clipping_ratio"]
                
                if clipping > 0.01:  # More than 1% clipped
                    suitability["issues"].append("Audio clipping detected - reduce recording level")
                    score += 5
                elif clipping > 0.001:  # More than 0.1% clipped
                    suitability["recommendations"].append("Minor clipping detected")
                    score += 10
                else:
                    suitability["strengths"].append("No audio clipping")
                    score += 15
            
            # Voice characteristics check
            voice_chars = analysis_results.get("voice_characteristics", {})
            if "harmonics_to_noise_ratio" in voice_chars:
                max_score += 20
                hnr = voice_chars["harmonics_to_noise_ratio"]
                
                if hnr < 5:
                    suitability["issues"].append("Voice quality issues detected")
                    score += 5
                elif hnr < 15:
                    suitability["recommendations"].append("Voice clarity could be improved")
                    score += 15
                else:
                    suitability["strengths"].append("Clear voice characteristics")
                    score += 20
            
            # Calculate overall score
            if max_score > 0:
                suitability["overall_score"] = (score / max_score) * 100
            
            # Overall verdict
            if suitability["overall_score"] >= 80:
                suitability["verdict"] = "Excellent for voice training"
            elif suitability["overall_score"] >= 60:
                suitability["verdict"] = "Good for voice training"
            elif suitability["overall_score"] >= 40:
                suitability["verdict"] = "Acceptable for voice training"
            else:
                suitability["verdict"] = "Poor quality - recommend re-recording"
            
            return suitability
            
        except Exception as e:
            logger.error(f"Training suitability assessment failed: {e}")
            return {
                "overall_score": 0,
                "verdict": "Assessment failed",
                "error": str(e)
            }
    
    def extract_voice_segments(self, audio_path: str, min_segment_duration: float = 3.0) -> List[str]:
        """Extract high-quality voice segments for training"""
        try:
            logger.info(f"Extracting voice segments from: {audio_path}")
            
            if not LIBROSA_AVAILABLE:
                logger.error("Audio processing not available")
                return []
            
            # Load audio
            y, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Voice activity detection
            voice_segments = self._detect_voice_segments(y, sr, min_segment_duration)
            
            if not voice_segments:
                logger.warning("No suitable voice segments found")
                return []
            
            # Extract segments to separate files
            base_path = Path(audio_path)
            output_dir = base_path.parent / f"{base_path.stem}_segments"
            output_dir.mkdir(exist_ok=True)
            
            extracted_files = []
            
            for i, (start_sample, end_sample) in enumerate(voice_segments):
                segment = y[start_sample:end_sample]
                
                # Apply gentle noise reduction and normalization
                segment = self._clean_audio_segment(segment, sr)
                
                # Save segment
                output_path = output_dir / f"segment_{i+1:02d}.wav"
                sf.write(str(output_path), segment, sr)
                extracted_files.append(str(output_path))
                
                logger.info(f"Extracted segment {i+1}: {len(segment)/sr:.1f}s")
            
            return extracted_files
            
        except Exception as e:
            logger.error(f"Voice segment extraction failed: {e}")
            return []
    
    def _detect_voice_segments(self, y: np.ndarray, sr: int, min_duration: float) -> List[Tuple[int, int]]:
        """Detect voice activity segments"""
        try:
            # Energy-based voice activity detection
            frame_length = 2048
            hop_length = 512
            
            # Calculate frame energy
            frames = librosa.util.frame(y, frame_length=frame_length, hop_length=hop_length, axis=0)
            energy = np.sum(frames ** 2, axis=0)
            
            # Adaptive threshold
            energy_smooth = scipy.signal.medfilt(energy, kernel_size=5) if SCIPY_AVAILABLE else energy
            threshold = np.percentile(energy_smooth, 30)  # Bottom 30% as silence
            
            # Voice activity
            voice_activity = energy_smooth > threshold
            
            # Find continuous voice segments
            segments = []
            in_voice = False
            segment_start = 0
            
            min_samples = int(min_duration * sr)
            
            for i, is_voice in enumerate(voice_activity):
                sample_pos = i * hop_length
                
                if is_voice and not in_voice:
                    in_voice = True
                    segment_start = sample_pos
                elif not is_voice and in_voice:
                    in_voice = False
                    segment_end = sample_pos
                    
                    if segment_end - segment_start >= min_samples:
                        segments.append((segment_start, min(segment_end, len(y))))
            
            # Handle case where voice continues to end
            if in_voice:
                segment_end = len(y)
                if segment_end - segment_start >= min_samples:
                    segments.append((segment_start, segment_end))
            
            return segments
            
        except Exception as e:
            logger.warning(f"Voice segment detection failed: {e}")
            return []
    
    def _clean_audio_segment(self, segment: np.ndarray, sr: int) -> np.ndarray:
        """Apply basic cleaning to audio segment"""
        try:
            # Trim silence
            segment, _ = librosa.effects.trim(segment, top_db=20)
            
            # Normalize
            segment = librosa.util.normalize(segment)
            
            # Apply gentle high-pass filter to remove low-frequency noise
            if SCIPY_AVAILABLE:
                sos = scipy.signal.butter(2, 80, btype='highpass', fs=sr, output='sos')
                segment = scipy.signal.sosfilt(sos, segment)
            
            return segment
            
        except Exception as e:
            logger.warning(f"Audio cleaning failed: {e}")
            return segment