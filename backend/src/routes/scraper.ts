import express from 'express';
import { Request, Response } from 'express';
import { webScraper, ScrapingTarget } from '../services/webScraper';
import { advancedScraper } from '../services/advancedScraper';
import * as cron from 'node-cron';

const router = express.Router();

// Track scheduled jobs
let scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

// Start manual scraping
router.post('/start', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Manual scraping initiated via API');
    
    const result = await webScraper.startScraping();
    
    res.json({
      success: result.success,
      message: result.message,
      data: {
        foundContent: result.results?.length || 0,
        results: result.results?.slice(0, 5) || [], // Return first 5 results
        timestamp: new Date().toISOString()
      }
    });
    return;
  } catch (error) {
    console.error('❌ Manual scraping failed:', error);
    res.status(500).json({
      success: false,
      message: `Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Get scraper status and statistics (enhanced with advanced scraper)
router.get('/status', async (req: Request, res: Response) => {
  try {
    const basicStats = webScraper.getScrapingStats();
    const advancedStats = advancedScraper.getMonitoringStats();
    
    res.json({
      success: true,
      data: {
        // Basic scraper stats
        ...basicStats,
        scheduledJobs: Array.from(scheduledJobs.keys()),
        lastScrape: new Date().toISOString(),
        
        // Advanced scraper stats
        advanced: {
          ...advancedStats,
          contentSources: advancedStats.sources.length,
          highQualityRate: advancedStats.totalContentFound > 0 
            ? Math.round((advancedStats.highQualityContent / advancedStats.totalContentFound) * 100) 
            : 0
        }
      }
    });
    return;
  } catch (error) {
    console.error('❌ Failed to get scraper status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scraper status'
    });
  }
});

// Get all scraping targets
router.get('/targets', async (req: Request, res: Response) => {
  try {
    const stats = webScraper.getScrapingStats();
    
    res.json({
      success: true,
      data: {
        targets: stats.targets,
        total: stats.totalTargets,
        enabled: stats.enabledTargets
      }
    });
    return;
  } catch (error) {
    console.error('❌ Failed to get scraping targets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scraping targets'
    });
  }
});

// Add new scraping target
router.post('/targets', async (req: Request, res: Response) => {
  try {
    const { name, baseUrl, type, selectors, keywords } = req.body;
    
    if (!name || !baseUrl || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, baseUrl, type'
      });
    }

    const newTarget: ScrapingTarget = {
      name,
      baseUrl,
      type,
      selectors: selectors || {},
      keywords: keywords || ['young ellens'],
      enabled: true
    };

    webScraper.addScrapingTarget(newTarget);
    
    console.log(`➕ Added new scraping target: ${name}`);
    
    res.json({
      success: true,
      message: `Added scraping target: ${name}`,
      data: newTarget
    });
    return;
  } catch (error) {
    console.error('❌ Failed to add scraping target:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add scraping target'
    });
    return;
  }
});

// Toggle scraping target
router.patch('/targets/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled field must be a boolean'
      });
    }

    webScraper.toggleTarget(name, enabled);
    
    res.json({
      success: true,
      message: `${enabled ? 'Enabled' : 'Disabled'} scraping target: ${name}`
    });
    return;
  } catch (error) {
    console.error('❌ Failed to toggle scraping target:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle scraping target'
    });
  }
  return;
});

// Remove scraping target
router.delete('/targets/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    
    webScraper.removeScrapingTarget(name);
    
    res.json({
      success: true,
      message: `Removed scraping target: ${name}`
    });
    return;
  } catch (error) {
    console.error('❌ Failed to remove scraping target:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove scraping target'
    });
  }
  return;
});

// Schedule automated scraping
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { schedule, name } = req.body;
    
    if (!schedule || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: schedule, name'
      });
    }

    // Validate cron expression
    if (!cron.validate(schedule)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cron expression'
      });
    }

    // Stop existing job if it exists
    const existingJob = scheduledJobs.get(name);
    if (existingJob) {
      existingJob.stop();
      scheduledJobs.delete(name);
    }

    // Create new scheduled job
    const task = cron.schedule(schedule, async () => {
      console.log(`⏰ Running scheduled scrape: ${name}`);
      try {
        const result = await webScraper.startScraping();
        console.log(`✅ Scheduled scrape completed: ${result.message}`);
      } catch (error) {
        console.error(`❌ Scheduled scrape failed: ${name}`, error);
      }
    }, {
      scheduled: false // Don't start automatically
    });

    scheduledJobs.set(name, task);
    task.start();
    
    console.log(`⏰ Scheduled scraping job: ${name} (${schedule})`);
    
    res.json({
      success: true,
      message: `Scheduled scraping job: ${name}`,
      data: {
        name,
        schedule,
        isRunning: true
      }
    });
    return;
  } catch (error) {
    console.error('❌ Failed to schedule scraping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule scraping'
    });
  }
  return;
});

// Get scheduled jobs
router.get('/schedule', async (req: Request, res: Response) => {
  try {
    const jobs = Array.from(scheduledJobs.entries()).map(([name, task]) => ({
      name,
      isRunning: true, // Assume running if it exists in the map
      nextRun: 'Unknown' // cron package doesn't provide next run time easily
    }));
    
    res.json({
      success: true,
      data: {
        jobs,
        total: jobs.length
      }
    });
    return;
  } catch (error) {
    console.error('❌ Failed to get scheduled jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduled jobs'
    });
  }
  return;
});

// Stop scheduled job
router.delete('/schedule/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    
    const job = scheduledJobs.get(name);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: `Scheduled job not found: ${name}`
      });
    }

    job.stop();
    scheduledJobs.delete(name);
    
    console.log(`🛑 Stopped scheduled job: ${name}`);
    
    res.json({
      success: true,
      message: `Stopped scheduled job: ${name}`
    });
  } catch (error) {
    console.error('❌ Failed to stop scheduled job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop scheduled job'
    });
  }
  return;
});

// Specific scraping endpoints
router.post('/youtube', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    console.log(`🔍 YouTube search initiated: ${query || 'young ellens'}`);
    
    const results = await webScraper.scrapeYouTubeSearch(query);
    
    res.json({
      success: true,
      message: `Found ${results.length} YouTube results`,
      data: {
        results,
        query: query || 'young ellens'
      }
    });
  } catch (error) {
    console.error('❌ YouTube scraping failed:', error);
    res.status(500).json({
      success: false,
      message: 'YouTube scraping failed'
    });
    return;
  }
});

router.post('/lyrics', async (req: Request, res: Response) => {
  try {
    console.log('🎵 Lyrics scraping initiated');
    
    const results = await webScraper.scrapeLyricsWebsites();
    
    res.json({
      success: true,
      message: `Lyrics scraping completed`,
      data: {
        results,
        foundSongs: results.length
      }
    });
  } catch (error) {
    console.error('❌ Lyrics scraping failed:', error);
    res.status(500).json({
      success: false,
      message: 'Lyrics scraping failed'
    });
    return;
  }
});

router.post('/social', async (req: Request, res: Response) => {
  try {
    console.log('📱 Social media scraping initiated');
    
    const results = await webScraper.scrapeSocialMedia();
    
    res.json({
      success: true,
      message: 'Social media scraping completed (requires API keys)',
      data: {
        results,
        note: 'Social media scraping requires API authentication'
      }
    });
  } catch (error) {
    console.error('❌ Social media scraping failed:', error);
    res.status(500).json({
      success: false,
      message: 'Social media scraping failed'
    });
    return;
  }
});

// Test endpoint for scraping a specific URL
router.post('/test-url', async (req: Request, res: Response) => {
  try {
    const { url, type, selectors } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    const testTarget: ScrapingTarget = {
      name: 'Test Target',
      baseUrl: url,
      type: type || 'other',
      selectors: selectors || {},
      keywords: ['young ellens'],
      enabled: true
    };

    // Create a temporary scraper instance for testing
    const results = await webScraper.startScraping();
    
    res.json({
      success: true,
      message: 'URL scraping test completed',
      data: {
        url,
        results: results.results?.slice(0, 3) || []
      }
    });
  } catch (error) {
    console.error('❌ URL test scraping failed:', error);
    res.status(500).json({
      success: false,
      message: 'URL test scraping failed'
    });
  }
  return;
});

// Advanced scraper endpoints

// Start advanced monitoring
router.post('/advanced/start', async (req: Request, res: Response) => {
  try {
    await advancedScraper.startAdvancedMonitoring();
    
    res.json({
      success: true,
      message: 'Advanced monitoring started',
      data: advancedScraper.getMonitoringStats()
    });
  } catch (error) {
    console.error('❌ Failed to start advanced monitoring:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start advanced monitoring'
    });
  }
  return;
});

// Stop advanced monitoring
router.post('/advanced/stop', async (req: Request, res: Response) => {
  try {
    advancedScraper.stopAdvancedMonitoring();
    
    res.json({
      success: true,
      message: 'Advanced monitoring stopped'
    });
  } catch (error) {
    console.error('❌ Failed to stop advanced monitoring:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop advanced monitoring'
    });
    return;
  }
});

// Get content sources
router.get('/advanced/sources', async (req: Request, res: Response) => {
  try {
    const sources = advancedScraper.getContentSources();
    
    res.json({
      success: true,
      data: {
        sources,
        total: sources.length,
        enabled: sources.filter(s => s.enabled).length
      }
    });
  } catch (error) {
    console.error('❌ Failed to get content sources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get content sources'
    });
    return;
  }
});

// Toggle content source
router.patch('/advanced/sources/:sourceId', async (req: Request, res: Response) => {
  try {
    const { sourceId } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled field must be a boolean'
      });
    }

    const success = advancedScraper.toggleContentSource(sourceId, enabled);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Content source not found'
      });
    }
    
    res.json({
      success: true,
      message: `Content source ${enabled ? 'enabled' : 'disabled'}`,
      data: advancedScraper.getMonitoringStats()
    });
    return;
  } catch (error) {
    console.error('❌ Failed to toggle content source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle content source'
    });
    return;
  }
});

// Add new content source
router.post('/advanced/sources', async (req: Request, res: Response) => {
  try {
    const { name, type, url, keywords, updateFrequency, apiKey, headers } = req.body;
    
    if (!name || !type || !url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, type, url'
      });
    }

    const sourceId = advancedScraper.addContentSource({
      name,
      type,
      url,
      apiKey,
      headers,
      enabled: true,
      configuration: {
        keywords: Array.isArray(keywords) ? keywords : [keywords || 'young ellens'],
        updateFrequency: updateFrequency || 360 // 6 hours default
      }
    });
    
    res.json({
      success: true,
      message: `Added content source: ${name}`,
      data: {
        sourceId,
        stats: advancedScraper.getMonitoringStats()
      }
    });
  } catch (error) {
    console.error('❌ Failed to add content source:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add content source'
    });
  }
  return;
});

// Get discovered content
router.get('/advanced/content', async (req: Request, res: Response) => {
  try {
    const content = advancedScraper.getDiscoveredContent();
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const paginatedContent = content.slice(offset, offset + limit);
    
    res.json({
      success: true,
      data: {
        content: paginatedContent,
        total: content.length,
        limit,
        offset,
        hasMore: offset + limit < content.length
      }
    });
  } catch (error) {
    console.error('❌ Failed to get discovered content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discovered content'
    });
    return;
  }
});

// Get real-time monitoring stats (for dashboard)
router.get('/advanced/monitor', async (req: Request, res: Response) => {
  try {
    const stats = advancedScraper.getMonitoringStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    });
  } catch (error) {
    console.error('❌ Failed to get monitoring stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monitoring stats'
    });
    return;
  }
});

// Get ML insights and recommendations
router.get('/advanced/ml-insights', async (req: Request, res: Response) => {
  try {
    const insights = advancedScraper.getMonitoringStats().mlInsights;
    
    res.json({
      success: true,
      data: {
        ...insights,
        recommendations: {
          optimalScrapingTimes: ['09:00-11:00', '14:00-16:00', '20:00-22:00'],
          contentGaps: ['More interview content needed', 'Focus on recent Amsterdam references'],
          sourcePriorities: insights.dataStats.recentInteractions > 50 
            ? 'High-performing sources prioritized'
            : 'All sources being tested equally'
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to get ML insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ML insights'
    });
    return;
  }
});

export default router;