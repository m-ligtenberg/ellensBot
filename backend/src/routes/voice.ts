import express, { Request, Response } from 'express';
import multer from 'multer';
import { voiceCloneService } from '../services/voiceCloneService';
import { db } from '../database/connection';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Upload voice clip
router.post('/clips/upload', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { transcription, tags } = req.body;
    
    console.log('📼 Uploading voice clip:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const voiceClip = await voiceCloneService.saveVoiceClip(req.file, transcription);

    // Add tags if provided
    if (tags) {
      await db.query(`
        UPDATE voice_clips 
        SET tags = $1 
        WHERE id = $2
      `, [tags.split(',').map((tag: string) => tag.trim()), voiceClip.id]);
    }

    res.json({
      success: true,
      clip: voiceClip,
      message: 'Voice clip uploaded and processed successfully'
    });

  } catch (error) {
    console.error('Voice clip upload error:', error);
    res.status(500).json({
      error: 'Failed to upload voice clip',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all voice clips
router.get('/clips', async (req: Request, res: Response) => {
  try {
    const clips = await voiceCloneService.getVoiceClips();
    
    res.json({
      success: true,
      clips,
      total: clips.length,
      stats: {
        processed: clips.filter(c => c.is_processed).length,
        total_duration: clips.reduce((sum, c) => sum + c.duration, 0),
        avg_quality: clips.filter(c => c.quality_score).reduce((sum, c) => sum + (c.quality_score || 0), 0) / clips.filter(c => c.quality_score).length || 0
      }
    });

  } catch (error) {
    console.error('Get voice clips error:', error);
    res.status(500).json({
      error: 'Failed to fetch voice clips',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific voice clip
router.get('/clips/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT vc.*, aa.* 
      FROM voice_clips vc
      LEFT JOIN audio_analysis aa ON vc.id = aa.clip_id
      WHERE vc.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voice clip not found' });
    }

    res.json({
      success: true,
      clip: result.rows[0]
    });

  } catch (error) {
    console.error('Get voice clip error:', error);
    res.status(500).json({
      error: 'Failed to fetch voice clip',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Download voice clip
router.get('/clips/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT file_path, original_filename 
      FROM voice_clips 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voice clip not found' });
    }

    const clip = result.rows[0];
    
    if (!fs.existsSync(clip.file_path)) {
      return res.status(404).json({ error: 'Audio file not found on disk' });
    }

    res.download(clip.file_path, clip.original_filename);

  } catch (error) {
    console.error('Download voice clip error:', error);
    res.status(500).json({
      error: 'Failed to download voice clip',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete voice clip
router.delete('/clips/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await voiceCloneService.deleteVoiceClip(id);
    
    res.json({
      success: true,
      message: 'Voice clip deleted successfully'
    });

  } catch (error) {
    console.error('Delete voice clip error:', error);
    res.status(500).json({
      error: 'Failed to delete voice clip',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Train voice model
router.post('/models/train', async (req: Request, res: Response) => {
  try {
    const { modelName, clipIds, language = 'nl' } = req.body;

    if (!modelName || !clipIds || !Array.isArray(clipIds) || clipIds.length < 3) {
      return res.status(400).json({ 
        error: 'Invalid request. Need model name and at least 3 clip IDs' 
      });
    }

    console.log('🎯 Starting voice model training:', {
      modelName,
      clipCount: clipIds.length,
      language
    });

    // Create training job
    const jobId = require('crypto').randomUUID();
    await db.query(`
      INSERT INTO voice_training_jobs 
      (id, model_name, clip_ids, language, status, created_at)
      VALUES ($1, $2, $3, $4, 'pending', NOW())
    `, [jobId, modelName, JSON.stringify(clipIds), language]);

    // Start training asynchronously
    setImmediate(async () => {
      try {
        await db.query(`
          UPDATE voice_training_jobs 
          SET status = 'running', started_at = NOW() 
          WHERE id = $1
        `, [jobId]);

        const model = await voiceCloneService.trainVoiceModel(modelName, clipIds, language);
        
        await db.query(`
          UPDATE voice_training_jobs 
          SET status = 'completed', completed_at = NOW(), model_id = $1 
          WHERE id = $2
        `, [model.id, jobId]);

        console.log('✅ Voice model training completed:', model.id);

      } catch (trainError) {
        console.error('❌ Voice model training failed:', trainError);
        await db.query(`
          UPDATE voice_training_jobs 
          SET status = 'failed', completed_at = NOW(), error_message = $1 
          WHERE id = $2
        `, [trainError instanceof Error ? trainError.message : 'Unknown error', jobId]);
      }
    });

    res.json({
      success: true,
      jobId,
      message: 'Voice model training started',
      estimatedDuration: '10-30 minutes'
    });

  } catch (error) {
    console.error('Train voice model error:', error);
    res.status(500).json({
      error: 'Failed to start voice model training',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get training job status
router.get('/training/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    const result = await db.query(`
      SELECT * FROM voice_training_jobs 
      WHERE id = $1
    `, [jobId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training job not found' });
    }

    res.json({
      success: true,
      job: result.rows[0]
    });

  } catch (error) {
    console.error('Get training job error:', error);
    res.status(500).json({
      error: 'Failed to fetch training job status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all voice models
router.get('/models', async (req: Request, res: Response) => {
  try {
    const models = await voiceCloneService.getVoiceModels();
    
    // Get usage stats for each model
    const modelsWithStats = await Promise.all(
      models.map(async (model) => {
        const statsResult = await db.query(`
          SELECT 
            COUNT(*) as total_generations,
            COALESCE(AVG(generation_time), 0) as avg_generation_time,
            COALESCE(SUM(duration), 0) as total_audio_generated
          FROM tts_generations 
          WHERE model_id = $1
        `, [model.id]);

        return {
          ...model,
          stats: statsResult.rows[0]
        };
      })
    );

    res.json({
      success: true,
      models: modelsWithStats,
      total: models.length,
      active_model: models.find(m => m.is_active)
    });

  } catch (error) {
    console.error('Get voice models error:', error);
    res.status(500).json({
      error: 'Failed to fetch voice models',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Set active model
router.put('/models/:id/activate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await voiceCloneService.setActiveModel(id);
    
    res.json({
      success: true,
      message: 'Voice model activated successfully'
    });

  } catch (error) {
    console.error('Activate voice model error:', error);
    res.status(500).json({
      error: 'Failed to activate voice model',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate TTS
router.post('/tts/generate', async (req: Request, res: Response) => {
  try {
    const { text, modelId, speed = 1.0, emotion = 'neutral', outputFormat = 'wav' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for TTS generation' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long. Maximum 5000 characters allowed.' });
    }

    console.log('🗣️ Generating TTS:', {
      textLength: text.length,
      modelId,
      speed,
      emotion
    });

    const startTime = Date.now();
    const result = await voiceCloneService.generateSpeech({
      text,
      model_id: modelId,
      speed,
      emotion,
      output_format: outputFormat
    });
    const generationTime = (Date.now() - startTime) / 1000;

    // Log generation
    const generationId = require('crypto').randomUUID();
    const modelQuery = await db.query(`
      SELECT id FROM voice_models WHERE is_active = true LIMIT 1
    `);
    
    const activeModelId = modelId || (modelQuery.rows[0]?.id);
    
    if (activeModelId) {
      await db.query(`
        INSERT INTO tts_generations 
        (id, model_id, input_text, output_path, duration, generation_time, settings, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        generationId,
        activeModelId,
        text,
        result.audioPath,
        result.duration,
        generationTime,
        JSON.stringify({ speed, emotion, outputFormat })
      ]);
    }

    res.json({
      success: true,
      audioUrl: `/api/voice/audio/${path.basename(result.audioPath)}`,
      duration: result.duration,
      generationTime,
      generationId
    });

  } catch (error) {
    console.error('TTS generation error:', error);
    res.status(500).json({
      error: 'Failed to generate speech',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Serve generated audio files
router.get('/audio/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const audioPath = path.join(process.cwd(), 'output', 'tts', filename);
    
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const contentType = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg'
    }[ext] || 'audio/wav';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    const stream = fs.createReadStream(audioPath);
    stream.pipe(res);

  } catch (error) {
    console.error('Serve audio error:', error);
    res.status(500).json({
      error: 'Failed to serve audio file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get TTS generation history
router.get('/tts/history', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await db.query(`
      SELECT tg.*, vm.name as model_name 
      FROM tts_generations tg
      LEFT JOIN voice_models vm ON tg.model_id = vm.id
      ORDER BY tg.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await db.query(`
      SELECT COUNT(*) as total FROM tts_generations
    `);

    res.json({
      success: true,
      generations: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

  } catch (error) {
    console.error('Get TTS history error:', error);
    res.status(500).json({
      error: 'Failed to fetch TTS history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Voice cloning analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    // Get clip statistics
    const clipStats = await db.query(`SELECT * FROM calculate_clip_stats()`);
    
    // Get model statistics
    const modelStats = await db.query(`
      SELECT 
        COUNT(*) as total_models,
        COUNT(*) FILTER (WHERE is_active = true) as active_models,
        AVG(quality_score) as avg_quality,
        SUM(model_size) as total_model_size
      FROM voice_models
    `);

    // Get generation statistics
    const generationStats = await db.query(`
      SELECT 
        COUNT(*) as total_generations,
        AVG(generation_time) as avg_generation_time,
        SUM(duration) as total_audio_generated,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM tts_generations
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);

    // Get recent activity
    const recentActivity = await db.query(`
      SELECT 
        'clip_upload' as activity_type,
        original_filename as description,
        created_at
      FROM voice_clips
      WHERE created_at > NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'model_training' as activity_type,
        model_name as description,
        created_at
      FROM voice_training_jobs
      WHERE created_at > NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'tts_generation' as activity_type,
        LEFT(input_text, 50) || '...' as description,
        created_at
      FROM tts_generations
      WHERE created_at > NOW() - INTERVAL '7 days'
      
      ORDER BY created_at DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      analytics: {
        clips: clipStats.rows[0],
        models: modelStats.rows[0],
        generations: generationStats.rows[0],
        recent_activity: recentActivity.rows
      }
    });

  } catch (error) {
    console.error('Get voice analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch voice analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;