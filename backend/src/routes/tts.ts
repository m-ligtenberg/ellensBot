import { Router } from 'express';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface TTSRequest {
  text: string;
  settings: {
    speed: number;
    pitch: number;
    volume: number;
    modelId: string;
  };
}

// Available Coqui TTS models configuration
const TTS_MODELS = {
  'ellens-dutch-male': {
    model: 'tts_models/nl/css10/vits',
    speaker: null,
    language: 'nl'
  },
  'dutch-casual-male': {
    model: 'tts_models/nl/mai/tacotron2-DDC',
    speaker: null,
    language: 'nl'
  },
  'dutch-standard': {
    model: 'tts_models/nl/css10/vits',
    speaker: null,
    language: 'nl'
  }
};

// Ensure temp directory exists
async function ensureTempDir(): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp', 'tts');
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    console.error('Error creating temp directory:', error);
  }
  return tempDir;
}

// Clean up old files (older than 1 hour)
async function cleanupOldFiles(directory: string): Promise<void> {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      // Delete files older than 1 hour
      if (now - stats.mtime.getTime() > 3600000) {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
}

// Generate TTS using Coqui TTS
async function generateTTSWithCoqui(
  text: string,
  modelConfig: any,
  settings: TTSRequest['settings'],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '--model_name', modelConfig.model,
      '--text', text,
      '--out_path', outputPath
    ];

    // Add speaker if specified
    if (modelConfig.speaker) {
      args.push('--speaker_idx', modelConfig.speaker);
    }

    // Add language if specified
    if (modelConfig.language) {
      args.push('--language_idx', modelConfig.language);
    }

    console.log(`🎤 Generating TTS with Coqui: ${args.join(' ')}`);

    const ttsProcess = spawn('tts', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    ttsProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ttsProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ttsProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TTS generation completed successfully');
        resolve();
      } else {
        console.error('❌ TTS generation failed:', stderr);
        reject(new Error(`TTS process exited with code ${code}: ${stderr}`));
      }
    });

    ttsProcess.on('error', (error) => {
      console.error('❌ TTS process error:', error);
      reject(error);
    });
  });
}

// Apply audio effects (speed, pitch, volume)
async function applyAudioEffects(
  inputPath: string,
  outputPath: string,
  settings: TTSRequest['settings']
): Promise<void> {
  return new Promise((resolve, reject) => {
    const effects = [];
    
    // Speed adjustment
    if (settings.speed !== 1.0) {
      effects.push('tempo', settings.speed.toString());
    }
    
    // Pitch adjustment
    if (settings.pitch !== 1.0) {
      const pitchCents = Math.log2(settings.pitch) * 1200;
      effects.push('pitch', pitchCents.toString());
    }
    
    // Volume adjustment
    if (settings.volume !== 1.0) {
      effects.push('vol', settings.volume.toString());
    }

    if (effects.length === 0) {
      // No effects needed, just copy the file
      fs.copyFile(inputPath, outputPath).then(resolve).catch(reject);
      return;
    }

    console.log(`🎛️ Applying audio effects: ${effects.join(' ')}`);

    const soxProcess = spawn('sox', [inputPath, outputPath, ...effects], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stderr = '';

    soxProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    soxProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Audio effects applied successfully');
        resolve();
      } else {
        console.error('❌ Audio effects failed:', stderr);
        reject(new Error(`Sox process exited with code ${code}: ${stderr}`));
      }
    });

    soxProcess.on('error', (error) => {
      console.error('❌ Sox process error:', error);
      reject(error);
    });
  });
}

// POST /api/tts/generate - Generate TTS audio
router.post('/generate', async (req, res) => {
  try {
    const { text, settings }: TTSRequest = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    if (text.length > 1000) {
      return res.status(400).json({ error: 'Text too long (max 1000 characters)' });
    }

    const modelConfig = TTS_MODELS[settings.modelId as keyof typeof TTS_MODELS];
    if (!modelConfig) {
      return res.status(400).json({ error: 'Invalid model ID' });
    }

    console.log(`🎤 Starting TTS generation for: "${text.substring(0, 50)}..."`);

    const tempDir = await ensureTempDir();
    await cleanupOldFiles(tempDir);

    const fileId = uuidv4();
    const rawOutputPath = path.join(tempDir, `tts_raw_${fileId}.wav`);
    const finalOutputPath = path.join(tempDir, `tts_final_${fileId}.wav`);

    try {
      // Generate TTS with Coqui
      await generateTTSWithCoqui(text, modelConfig, settings, rawOutputPath);

      // Apply audio effects if needed
      await applyAudioEffects(rawOutputPath, finalOutputPath, settings);

      // Read the final audio file
      const audioBuffer = await fs.readFile(finalOutputPath);

      // Set appropriate headers
      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="ellens-tts-${fileId}.wav"`
      });

      // Send the audio file
      res.send(audioBuffer);

      // Clean up temp files
      setTimeout(async () => {
        try {
          await fs.unlink(rawOutputPath);
          await fs.unlink(finalOutputPath);
        } catch (error) {
          console.error('Error cleaning up temp files:', error);
        }
      }, 5000);

      console.log(`✅ TTS generation completed for file: ${fileId}`);

    } catch (ttsError) {
      console.error('❌ TTS generation error:', ttsError);
      res.status(500).json({ 
        error: 'TTS generation failed',
        details: ttsError instanceof Error ? ttsError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ TTS endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tts/models - Get available TTS models
router.get('/models', (req, res) => {
  const models = Object.entries(TTS_MODELS).map(([id, config]) => ({
    id,
    model: config.model,
    language: config.language,
    speaker: config.speaker
  }));

  res.json({ models });
});

// GET /api/tts/health - Check TTS service health
router.get('/health', async (req, res) => {
  try {
    // Check if Coqui TTS is installed
    const ttsProcess = spawn('tts', ['--help'], { stdio: 'pipe' });
    
    ttsProcess.on('close', (code) => {
      if (code === 0) {
        res.json({ 
          status: 'healthy',
          coqui_available: true,
          models_count: Object.keys(TTS_MODELS).length
        });
      } else {
        res.json({ 
          status: 'degraded',
          coqui_available: false,
          error: 'Coqui TTS not found'
        });
      }
    });

    ttsProcess.on('error', () => {
      res.json({ 
        status: 'degraded',
        coqui_available: false,
        error: 'Coqui TTS not installed'
      });
    });

  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'TTS health check failed'
    });
  }
  return;
});

export default router;