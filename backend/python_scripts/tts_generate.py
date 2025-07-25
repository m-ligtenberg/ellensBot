#!/usr/bin/env python3
"""
Coqui-AI Text-to-Speech Script for EllensBot
"""
import sys
import json
import os
import torch
from TTS.api import TTS
import torchaudio
import librosa
import numpy as np

def generate_speech(text, model_path, reference_audio, output_path, language='nl', speed=1.0):
    """Generate speech using trained voice model"""
    try:
        print(f"Generating speech for text: {text[:50]}...")
        
        # Load the TTS model
        tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2", gpu=torch.cuda.is_available())
        
        # Generate speech
        output_audio = tts.tts(
            text=text,
            speaker_wav=reference_audio,
            language=language,
            split_sentences=True
        )
        
        # Apply speed modification if needed
        if speed != 1.0:
            output_audio = librosa.effects.time_stretch(output_audio, rate=speed)
        
        # Save audio
        torchaudio.save(output_path, torch.tensor(output_audio).unsqueeze(0), 22050)
        
        print(f"Speech generated successfully: {output_path}")
        return {
            "status": "success", 
            "output_path": output_path,
            "duration": len(output_audio) / 22050
        }
        
    except Exception as e:
        print(f"TTS generation failed: {str(e)}")
        return {"status": "error", "message": str(e)}

def main():
    if len(sys.argv) != 7:
        print("Usage: python tts_generate.py <text> <model_path> <reference_audio> <output_path> <language> <speed>")
        sys.exit(1)
    
    text = sys.argv[1]
    model_path = sys.argv[2]
    reference_audio = sys.argv[3]
    output_path = sys.argv[4]
    language = sys.argv[5]
    speed = float(sys.argv[6])
    
    result = generate_speech(text, model_path, reference_audio, output_path, language, speed)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
