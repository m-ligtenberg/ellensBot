#!/usr/bin/env python3
"""
Audio Processing Script for EllensBot Voice Clips
"""
import sys
import json
import librosa
import soundfile as sf
import numpy as np
from pathlib import Path
import webrtcvad
import collections

def process_audio_clip(input_path, output_path, target_sr=22050):
    """Process and clean audio clip for voice training"""
    try:
        print(f"Processing audio: {input_path}")
        
        # Load audio
        audio, sr = librosa.load(input_path, sr=None)
        
        # Resample to target sample rate
        if sr != target_sr:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)
        
        # Normalize audio
        audio = librosa.util.normalize(audio)
        
        # Remove silence
        audio_trimmed, _ = librosa.effects.trim(audio, top_db=20)
        
        # Apply noise reduction (simple spectral gating)
        stft = librosa.stft(audio_trimmed)
        magnitude = np.abs(stft)
        phase = np.angle(stft)
        
        # Spectral gating for noise reduction
        noise_floor = np.percentile(magnitude, 10)
        mask = magnitude > (noise_floor * 2)
        magnitude_clean = magnitude * mask
        
        # Reconstruct audio
        stft_clean = magnitude_clean * np.exp(1j * phase)
        audio_clean = librosa.istft(stft_clean)
        
        # Save processed audio
        sf.write(output_path, audio_clean, target_sr)
        
        # Calculate quality metrics
        duration = len(audio_clean) / target_sr
        snr = calculate_snr(audio_clean)
        
        print(f"Audio processed successfully: {output_path}")
        return {
            "status": "success",
            "output_path": output_path,
            "duration": duration,
            "sample_rate": target_sr,
            "snr": float(snr),
            "quality_score": min(max(snr / 20, 0), 1)  # Normalize SNR to 0-1
        }
        
    except Exception as e:
        print(f"Audio processing failed: {str(e)}")
        return {"status": "error", "message": str(e)}

def calculate_snr(audio):
    """Calculate signal-to-noise ratio"""
    # Simple SNR calculation
    signal_power = np.mean(audio ** 2)
    noise_power = np.mean((audio - np.mean(audio)) ** 2)
    if noise_power == 0:
        return float('inf')
    return 10 * np.log10(signal_power / noise_power)

def main():
    if len(sys.argv) != 3:
        print("Usage: python process_audio.py <input_path> <output_path>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    result = process_audio_clip(input_path, output_path)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
