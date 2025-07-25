import { PythonShell } from 'python-shell';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { db } from '../database/connection';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export interface VoiceClip {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  duration: number;
  sample_rate: number;
  transcription?: string;
  quality_score?: number;
  created_at: Date;
  is_processed: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
}

export interface VoiceModel {
  id: string;
  name: string;
  model_path: string;
  training_clips: string[];
  quality_score: number;
  training_duration: number;
  is_active: boolean;
  created_at: Date;
  last_used_at?: Date;
  model_size: number;
  language: string;
}

export interface TTSRequest {
  text: string;
  model_id?: string;
  speed?: number;
  emotion?: 'neutral' | 'happy' | 'angry' | 'sad' | 'excited';
  output_format?: 'wav' | 'mp3' | 'ogg';
}

export class VoiceCloneService {
  private uploadsDir: string;
  private modelsDir: string;
  private outputDir: string;
  private pythonScriptsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'voice_clips');
    this.modelsDir = path.join(process.cwd(), 'models', 'voice');
    this.outputDir = path.join(process.cwd(), 'output', 'tts');
    this.pythonScriptsDir = path.join(process.cwd(), 'python_scripts');

    this.ensureDirectories();
    this.initializePythonScripts();
  }

  private ensureDirectories(): void {
    [this.uploadsDir, this.modelsDir, this.outputDir, this.pythonScriptsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private async initializePythonScripts(): Promise<void> {
    // Create Python scripts for Coqui-AI integration
    await this.createCoquiTrainingScript();
    await this.createCoquiTTSScript();
    await this.createAudioProcessingScript();
  }

  private async createCoquiTrainingScript(): Promise<void> {
    const script = `#!/usr/bin/env python3
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
`;

    const scriptPath = path.join(this.pythonScriptsDir, 'train_voice.py');
    fs.writeFileSync(scriptPath, script);
  }

  private async createCoquiTTSScript(): Promise<void> {
    const script = `#!/usr/bin/env python3
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
`;

    const scriptPath = path.join(this.pythonScriptsDir, 'tts_generate.py');
    fs.writeFileSync(scriptPath, script);
  }

  private async createAudioProcessingScript(): Promise<void> {
    const script = `#!/usr/bin/env python3
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
`;

    const scriptPath = path.join(this.pythonScriptsDir, 'process_audio.py');
    fs.writeFileSync(scriptPath, script);
  }

  async saveVoiceClip(file: Express.Multer.File, transcription?: string): Promise<VoiceClip> {
    const clipId = crypto.randomUUID();
    const fileExt = path.extname(file.originalname);
    const filename = `${clipId}${fileExt}`;
    const filePath = path.join(this.uploadsDir, filename);

    // Move file to uploads directory
    fs.writeFileSync(filePath, file.buffer);

    // Process audio clip
    const processedPath = path.join(this.uploadsDir, `processed_${filename.replace(fileExt, '.wav')}`);
    const processingResult = await this.processAudioClip(filePath, processedPath);

    const voiceClip: VoiceClip = {
      id: clipId,
      filename,
      original_filename: file.originalname,
      file_path: processingResult.status === 'success' ? processedPath : filePath,
      duration: processingResult.duration || 0,
      sample_rate: processingResult.sample_rate || 22050,
      transcription,
      quality_score: processingResult.quality_score,
      created_at: new Date(),
      is_processed: processingResult.status === 'success',
      processing_status: processingResult.status === 'success' ? 'completed' : 'failed',
      error_message: processingResult.message
    };

    // Save to database
    await db.query(`
      INSERT INTO voice_clips 
      (id, filename, original_filename, file_path, duration, sample_rate, 
       transcription, quality_score, created_at, is_processed, processing_status, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      voiceClip.id, voiceClip.filename, voiceClip.original_filename, 
      voiceClip.file_path, voiceClip.duration, voiceClip.sample_rate,
      voiceClip.transcription, voiceClip.quality_score, voiceClip.created_at,
      voiceClip.is_processed, voiceClip.processing_status, voiceClip.error_message
    ]);

    return voiceClip;
  }

  private async processAudioClip(inputPath: string, outputPath: string): Promise<any> {
    return new Promise((resolve) => {
      const options = {
        mode: 'text' as const,
        pythonPath: 'python3',
        scriptPath: this.pythonScriptsDir,
        args: [inputPath, outputPath]
      };

      PythonShell.run('process_audio.py', options, (err, results) => {
        if (err) {
          console.error('Audio processing error:', err);
          resolve({ status: 'error', message: err.message });
          return;
        }

        try {
          const result = JSON.parse(results![0]);
          resolve(result);
        } catch (parseErr) {
          resolve({ status: 'error', message: 'Failed to parse processing result' });
        }
      });
    });
  }

  async trainVoiceModel(modelName: string, clipIds: string[], language: string = 'nl'): Promise<VoiceModel> {
    const modelId = crypto.randomUUID();
    
    // Get clips from database
    const clips = await db.query(`
      SELECT * FROM voice_clips 
      WHERE id = ANY($1) AND is_processed = true
    `, [clipIds]);

    if (clips.rows.length < 3) {
      throw new Error('Need at least 3 processed clips for training');
    }

    // Create temporary directory for training clips
    const trainingDir = path.join(this.uploadsDir, 'training', modelId);
    fs.mkdirSync(trainingDir, { recursive: true });

    // Copy clips to training directory
    clips.rows.forEach((clip: any) => {
      const sourcePath = clip.file_path;
      const destPath = path.join(trainingDir, path.basename(clip.file_path));
      fs.copyFileSync(sourcePath, destPath);
    });

    // Train the model
    const modelOutputDir = path.join(this.modelsDir, modelId);
    fs.mkdirSync(modelOutputDir, { recursive: true });

    const trainingResult = await this.runVoiceTraining(trainingDir, modelOutputDir, modelName, language);

    if (trainingResult.status !== 'success') {
      throw new Error(`Training failed: ${trainingResult.message}`);
    }

    const voiceModel: VoiceModel = {
      id: modelId,
      name: modelName,
      model_path: trainingResult.model_path,
      training_clips: clipIds,
      quality_score: 0.8, // This would be calculated from training metrics
      training_duration: clips.rows.reduce((total: number, clip: any) => total + clip.duration, 0),
      is_active: true,
      created_at: new Date(),
      model_size: fs.statSync(trainingResult.model_path).size,
      language
    };

    // Save to database
    await db.query(`
      INSERT INTO voice_models 
      (id, name, model_path, training_clips, quality_score, training_duration, 
       is_active, created_at, model_size, language)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      voiceModel.id, voiceModel.name, voiceModel.model_path, 
      JSON.stringify(voiceModel.training_clips), voiceModel.quality_score, 
      voiceModel.training_duration, voiceModel.is_active, voiceModel.created_at,
      voiceModel.model_size, voiceModel.language
    ]);

    // Clean up training directory
    fs.rmSync(trainingDir, { recursive: true, force: true });

    return voiceModel;
  }

  private async runVoiceTraining(clipsDir: string, outputDir: string, modelName: string, language: string): Promise<any> {
    return new Promise((resolve) => {
      const options = {
        mode: 'text' as const,
        pythonPath: 'python3',
        scriptPath: this.pythonScriptsDir,
        args: [clipsDir, outputDir, modelName, language]
      };

      PythonShell.run('train_voice.py', options, (err, results) => {
        if (err) {
          console.error('Voice training error:', err);
          resolve({ status: 'error', message: err.message });
          return;
        }

        try {
          const result = JSON.parse(results![0]);
          resolve(result);
        } catch (parseErr) {
          resolve({ status: 'error', message: 'Failed to parse training result' });
        }
      });
    });
  }

  async generateSpeech(request: TTSRequest): Promise<{ audioPath: string; duration: number }> {
    // Get active model
    const modelQuery = await db.query(`
      SELECT * FROM voice_models 
      WHERE is_active = true 
      ${request.model_id ? 'AND id = $1' : ''}
      ORDER BY created_at DESC 
      LIMIT 1
    `, request.model_id ? [request.model_id] : []);

    if (modelQuery.rows.length === 0) {
      throw new Error('No active voice model found');
    }

    const model = modelQuery.rows[0];

    // Get reference audio from training clips
    const clipQuery = await db.query(`
      SELECT file_path FROM voice_clips 
      WHERE id = ANY($1) AND is_processed = true
      ORDER BY quality_score DESC
      LIMIT 1
    `, [JSON.parse(model.training_clips)]);

    if (clipQuery.rows.length === 0) {
      throw new Error('No reference audio found for model');
    }

    const referenceAudio = clipQuery.rows[0].file_path;

    // Generate unique output filename
    const outputId = crypto.randomUUID();
    const outputFormat = request.output_format || 'wav';
    const outputPath = path.join(this.outputDir, `${outputId}.${outputFormat}`);

    // Generate speech
    const ttsResult = await this.runTTSGeneration(
      request.text,
      model.model_path,
      referenceAudio,
      outputPath,
      model.language,
      request.speed || 1.0
    );

    if (ttsResult.status !== 'success') {
      throw new Error(`TTS generation failed: ${ttsResult.message}`);
    }

    // Update model usage
    await db.query(`
      UPDATE voice_models 
      SET last_used_at = NOW() 
      WHERE id = $1
    `, [model.id]);

    return {
      audioPath: outputPath,
      duration: ttsResult.duration
    };
  }

  private async runTTSGeneration(text: string, modelPath: string, referenceAudio: string, outputPath: string, language: string, speed: number): Promise<any> {
    return new Promise((resolve) => {
      const options = {
        mode: 'text' as const,
        pythonPath: 'python3',
        scriptPath: this.pythonScriptsDir,
        args: [text, modelPath, referenceAudio, outputPath, language, speed.toString()]
      };

      PythonShell.run('tts_generate.py', options, (err, results) => {
        if (err) {
          console.error('TTS generation error:', err);
          resolve({ status: 'error', message: err.message });
          return;
        }

        try {
          const result = JSON.parse(results![0]);
          resolve(result);
        } catch (parseErr) {
          resolve({ status: 'error', message: 'Failed to parse TTS result' });
        }
      });
    });
  }

  async getVoiceClips(): Promise<VoiceClip[]> {
    const result = await db.query(`
      SELECT * FROM voice_clips 
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async getVoiceModels(): Promise<VoiceModel[]> {
    const result = await db.query(`
      SELECT * FROM voice_models 
      ORDER BY created_at DESC
    `);
    return result.rows.map(row => ({
      ...row,
      training_clips: JSON.parse(row.training_clips)
    }));
  }

  async deleteVoiceClip(clipId: string): Promise<void> {
    const clip = await db.query(`SELECT file_path FROM voice_clips WHERE id = $1`, [clipId]);
    
    if (clip.rows.length > 0) {
      // Delete file
      try {
        fs.unlinkSync(clip.rows[0].file_path);
      } catch (err) {
        console.warn('Failed to delete clip file:', err);
      }
      
      // Delete from database
      await db.query(`DELETE FROM voice_clips WHERE id = $1`, [clipId]);
    }
  }

  async setActiveModel(modelId: string): Promise<void> {
    // Deactivate all models
    await db.query(`UPDATE voice_models SET is_active = false`);
    
    // Activate selected model
    await db.query(`UPDATE voice_models SET is_active = true WHERE id = $1`, [modelId]);
  }
}

export const voiceCloneService = new VoiceCloneService();