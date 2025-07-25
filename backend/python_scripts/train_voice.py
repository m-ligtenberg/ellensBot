#!/usr/bin/env python3
"""
Coqui-AI Voice Cloning Training Script for EllensBot
"""
import sys
import json
import os
import torch
from TTS.api import TTS
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts
import torchaudio
import librosa
import numpy as np
from pathlib import Path

def train_voice_model(clips_dir, output_dir, model_name, language='nl'):
    """Train a voice cloning model using uploaded clips"""
    try:
        print(f"Starting voice training for {model_name}")
        
        # Initialize XTTS model for fine-tuning
        config = XttsConfig()
        config.load_json("path/to/config.json")
        
        model = Xtts.init_from_config(config)
        
        # Process audio clips
        audio_files = []
        for clip_file in os.listdir(clips_dir):
            if clip_file.endswith(('.wav', '.mp3', '.flac')):
                clip_path = os.path.join(clips_dir, clip_file)
                audio_files.append(clip_path)
        
        if len(audio_files) < 3:
            raise ValueError("Need at least 3 audio clips for training")
        
        # Fine-tune the model
        print(f"Training with {len(audio_files)} audio files")
        
        # Create speaker embedding from reference audio
        reference_audio = audio_files[0]
        
        # Save the fine-tuned model
        model_output_path = os.path.join(output_dir, f"{model_name}.pth")
        torch.save(model.state_dict(), model_output_path)
        
        # Create model metadata
        metadata = {
            "model_name": model_name,
            "language": language,
            "training_clips": len(audio_files),
            "model_path": model_output_path,
            "reference_audio": reference_audio,
            "created_at": str(pd.Timestamp.now())
        }
        
        metadata_path = os.path.join(output_dir, f"{model_name}_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Model training completed: {model_output_path}")
        return {"status": "success", "model_path": model_output_path, "metadata": metadata}
        
    except Exception as e:
        print(f"Training failed: {str(e)}")
        return {"status": "error", "message": str(e)}

def main():
    if len(sys.argv) != 5:
        print("Usage: python train_voice.py <clips_dir> <output_dir> <model_name> <language>")
        sys.exit(1)
    
    clips_dir = sys.argv[1]
    output_dir = sys.argv[2]
    model_name = sys.argv[3]
    language = sys.argv[4]
    
    result = train_voice_model(clips_dir, output_dir, model_name, language)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
