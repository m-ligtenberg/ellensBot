import axios from 'axios';
import * as cheerio from 'cheerio';
import { webScraper, ScrapedContent } from './webScraper';
import { contentLearning } from './contentLearning';
import { translationService } from './translationService';
import { mlPatternOptimizer } from './mlPatternOptimizer';

export interface ContentSource {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'website' | 'social' | 'streaming';
  url: string;
  apiKey?: string;
  headers?: Record<string, string>;
  enabled: boolean;
  lastChecked?: string;
  itemsFound?: number;
  successRate?: number;
  configuration: {
    selectors?: Record<string, string>;
    keywords: string[];
    language?: string;
    contentFilter?: string;
    updateFrequency: number; // minutes
  };
}

export interface ContentQualityScore {
  relevanceScore: number; // 0-100
  authenticityScore: number; // 0-100  
  freshnessScore: number; // 0-100
  completenessScore: number; // 0-100
  overallScore: number; // 0-100
  reasons: string[];
}

export interface AdvancedScrapedContent extends ScrapedContent {
  qualityScore: ContentQualityScore;
  similarityHash: string;
  extractedEntities: {
    people: string[];
    places: string[];
    events: string[];
    drugReferences: string[];
    musicTerms: string[];
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  language: string;
  translatedContent?: string;
}

export class AdvancedScraperService {
  private static instance: AdvancedScraperService;
  private contentSources: ContentSource[] = [];
  private discoveredContent: AdvancedScrapedContent[] = [];
  private isMonitoring = false;
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeDefaultSources();
  }

  public static getInstance(): AdvancedScraperService {
    if (!AdvancedScraperService.instance) {
      AdvancedScraperService.instance = new AdvancedScraperService();
    }
    return AdvancedScraperService.instance;
  }

  private initializeDefaultSources(): void {
    this.contentSources = [
      // RSS Feeds
      {
        id: 'hiphop-rss',
        name: 'Dutch Hip-Hop RSS',
        type: 'rss',
        url: 'https://www.hiphopinjesmoel.com/feed',
        enabled: true,
        configuration: {
          keywords: ['young ellens', 'mr cocaine', 'amsterdam rap', 'damsko'],
          updateFrequency: 60 // Check every hour
        }
      },
      {
        id: 'funx-rss',
        name: 'FunX Radio RSS',
        type: 'rss', 
        url: 'https://funx.nl/feed',
        enabled: true,
        configuration: {
          keywords: ['young ellens', 'interview', 'rap'],
          updateFrequency: 120
        }
      },
      
      // API Integrations (would need API keys)
      {
        id: 'youtube-api',
        name: 'YouTube Data API',
        type: 'api',
        url: 'https://www.googleapis.com/youtube/v3/search',
        enabled: false, // Requires API key
        configuration: {
          keywords: ['young ellens', 'mr cocaine', 'b-negar'],
          updateFrequency: 360, // Every 6 hours
          contentFilter: 'video'
        }
      },
      {
        id: 'spotify-api',
        name: 'Spotify Web API',
        type: 'api',
        url: 'https://api.spotify.com/v1/search',
        enabled: false, // Requires API key
        configuration: {
          keywords: ['young ellens'],
          updateFrequency: 720, // Every 12 hours
          contentFilter: 'track,album,artist'
        }
      },
      
      // Website Monitoring
      {
        id: 'genius-monitor',
        name: 'Genius Artist Monitor',
        type: 'website',
        url: 'https://genius.com/artists/Young-ellens',
        enabled: true,
        configuration: {
          selectors: {
            songLinks: 'a[href*="/Young-ellens-"]',
            title: '.header_with_cover_art-primary_info-title',
            lyrics: '[data-lyrics-container="true"]'
          },
          keywords: ['young ellens'],
          updateFrequency: 240 // Every 4 hours
        }
      },
      {
        id: 'reddit-monitor',
        name: 'Reddit Dutch Hip-Hop',
        type: 'website',
        url: 'https://www.reddit.com/r/DutchHipHop/search.json?q=young+ellens&sort=new',
        enabled: true,
        configuration: {
          keywords: ['young ellens', 'mr cocaine'],
          updateFrequency: 180 // Every 3 hours
        }
      },

      // Social Media (limited without APIs)
      {
        id: 'instagram-monitor',
        name: 'Instagram Hashtag Monitor',
        type: 'social',
        url: 'https://www.instagram.com/explore/tags/youngellens/',
        enabled: false, // Requires special handling
        configuration: {
          keywords: ['youngellens', 'mrcocaine', 'bnegar'],
          updateFrequency: 120
        }
      },

      // Streaming Platforms
      {
        id: 'soundcloud-monitor',
        name: 'SoundCloud Search',
        type: 'streaming',
        url: 'https://soundcloud.com/search?q=young%20ellens',
        enabled: true,
        configuration: {
          keywords: ['young ellens', 'amsterdam rap'],
          updateFrequency: 300 // Every 5 hours
        }
      }
    ];
  }

  public async startAdvancedMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ Advanced monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('🚀 Starting advanced content monitoring...');

    // Start monitoring for each enabled source
    for (const source of this.contentSources.filter(s => s.enabled)) {
      this.startSourceMonitoring(source);
    }

    console.log(`✅ Advanced monitoring started for ${this.contentSources.filter(s => s.enabled).length} sources`);
  }

  public stopAdvancedMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    // Clear all monitoring intervals
    for (const [sourceId, interval] of this.monitoringIntervals) {
      clearInterval(interval);
      this.monitoringIntervals.delete(sourceId);
    }

    console.log('🛑 Advanced monitoring stopped');
  }

  private startSourceMonitoring(source: ContentSource): void {
    // Use ML-optimized frequency
    const baseFrequency = source.configuration.updateFrequency;
    const optimizedFrequency = mlPatternOptimizer.optimizeSourceFrequency(source.id);
    const intervalMs = optimizedFrequency * 60 * 1000;
    
    // Update source configuration with optimized frequency
    source.configuration.updateFrequency = optimizedFrequency;
    
    // Initial check
    this.checkContentSource(source);
    
    // Set up recurring checks
    const interval = setInterval(() => {
      this.checkContentSource(source);
    }, intervalMs);

    this.monitoringIntervals.set(source.id, interval);
    console.log(`⏰ Started monitoring: ${source.name} (optimized: every ${optimizedFrequency} minutes, was ${baseFrequency})`);
  }

  private async checkContentSource(source: ContentSource): Promise<void> {
    try {
      console.log(`🔍 Checking content source: ${source.name}`);
      
      let newContent: AdvancedScrapedContent[] = [];
      
      switch (source.type) {
        case 'rss':
          newContent = await this.scrapeRSSFeed(source);
          break;
        case 'api':
          newContent = await this.queryAPI(source);
          break;
        case 'website':
          newContent = await this.scrapeWebsite(source);
          break;
        case 'social':
          newContent = await this.scrapeSocialMedia(source);
          break;
        case 'streaming':
          newContent = await this.scrapeStreamingPlatform(source);
          break;
      }

      let qualifiedContent: AdvancedScrapedContent[] = [];
      
      if (newContent.length > 0) {
        console.log(`✅ Found ${newContent.length} new items from ${source.name}`);
        
        // Process and filter content
        qualifiedContent = await this.processAndFilterContent(newContent);
        
        if (qualifiedContent.length > 0) {
          this.discoveredContent.push(...qualifiedContent);
          
          // Broadcast new content discovery to admin panels
          this.broadcastContentDiscovery(qualifiedContent, source.name);
          
          // Auto-integrate high-quality content
          await this.autoIntegrateContent(qualifiedContent);
        }
      }

      // Update source statistics and ML performance data
      source.lastChecked = new Date().toISOString();
      source.itemsFound = (source.itemsFound || 0) + newContent.length;
      
      // Update ML source performance
      if (qualifiedContent.length > 0) {
        mlPatternOptimizer.updateSourcePerformance(source.id, source.name, {
          totalAttempts: (source.itemsFound || 0) + 1,
          successfulIntegrations: qualifiedContent.length,
          avgQualityScore: qualifiedContent.reduce((sum: number, c: any) => sum + c.qualityScore.overallScore, 0) / qualifiedContent.length
        });
      }
      
    } catch (error) {
      console.error(`❌ Failed to check source ${source.name}:`, error);
      
      // Update failure rate
      const currentRate = source.successRate || 100;
      source.successRate = Math.max(0, currentRate - 5); // Decrease success rate
      
      // Update ML performance with failure
      mlPatternOptimizer.updateSourcePerformance(source.id, source.name, {
        totalAttempts: (source.itemsFound || 0) + 1,
        successfulIntegrations: 0
      });
    }
  }

  private async scrapeRSSFeed(source: ContentSource): Promise<AdvancedScrapedContent[]> {
    const results: AdvancedScrapedContent[] = [];
    
    try {
      const response = await axios.get(source.url, {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml'
        }
      });
      
      const $ = cheerio.load(response.data, { xmlMode: true });
      
      const items = $('item').toArray();
      for (const element of items) {
        const title = $(element).find('title').text();
        const description = $(element).find('description').text();
        const link = $(element).find('link').text();
        const pubDate = $(element).find('pubDate').text();
        
        // Check if content matches keywords
        const fullText = `${title} ${description}`.toLowerCase();
        const hasKeyword = source.configuration.keywords.some(keyword => 
          fullText.includes(keyword.toLowerCase())
        );
        
        if (hasKeyword) {
          const content = await this.createAdvancedContent({
            title: `RSS: ${title}`,
            content: description,
            source: source.name,
            url: link,
            type: 'news',
            timestamp: pubDate || new Date().toISOString(),
            metadata: {
              platform: source.name,
              pubDate
            }
          });
          
          results.push(content);
        }
      }
      
    } catch (error) {
      console.error(`Failed to scrape RSS feed ${source.name}:`, error);
    }
    
    return results;
  }

  private async queryAPI(source: ContentSource): Promise<AdvancedScrapedContent[]> {
    const results: AdvancedScrapedContent[] = [];
    
    if (!source.apiKey) {
      console.log(`⚠️ API key required for ${source.name}`);
      return results;
    }

    try {
      // Example YouTube API query
      if (source.id === 'youtube-api') {
        const params = {
          part: 'snippet',
          q: source.configuration.keywords.join(' OR '),
          type: 'video',
          maxResults: 10,
          key: source.apiKey
        };
        
        const response = await axios.get(source.url, { params });
        
        for (const item of response.data.items || []) {
          const content = await this.createAdvancedContent({
            title: `YouTube: ${item.snippet.title}`,
            content: item.snippet.description,
            source: 'YouTube API',
            url: `https://youtube.com/watch?v=${item.id.videoId}`,
            type: 'video',
            timestamp: item.snippet.publishedAt,
            metadata: {
              platform: 'YouTube',
              channelTitle: item.snippet.channelTitle,
              videoId: item.id.videoId
            }
          });
          
          results.push(content);
        }
      }
      
      // Example Spotify API query
      if (source.id === 'spotify-api') {
        const params = {
          q: `artist:"Young Ellens"`,
          type: 'track,album',
          limit: 20
        };
        
        const response = await axios.get(source.url, {
          params,
          headers: {
            'Authorization': `Bearer ${source.apiKey}`
          }
        });
        
        // Process Spotify results...
      }
      
    } catch (error) {
      console.error(`API query failed for ${source.name}:`, error);
    }
    
    return results;
  }

  private async scrapeWebsite(source: ContentSource): Promise<AdvancedScrapedContent[]> {
    const results: AdvancedScrapedContent[] = [];
    
    try {
      const response = await axios.get(source.url);
      const $ = cheerio.load(response.data);
      
      // Special handling for different websites
      if (source.id === 'genius-monitor') {
        // Check for new songs
        $(source.configuration.selectors?.songLinks || 'a').each((i, element) => {
          const href = $(element).attr('href');
          const title = $(element).text().trim();
          
          if (href && title && this.isYoungEllensContent(title)) {
            // Queue this song URL for detailed scraping
            this.queueDetailedScraping(this.resolveUrl(source.url, href), 'lyrics');
          }
        });
      }
      
      if (source.id === 'reddit-monitor') {
        // Parse Reddit JSON response
        try {
          const data = JSON.parse(response.data);
          
          for (const post of data.data?.children || []) {
            const postData = post.data;
            
            if (this.isYoungEllensContent(postData.title + ' ' + postData.selftext)) {
              const content = await this.createAdvancedContent({
                title: `Reddit: ${postData.title}`,
                content: postData.selftext || postData.title,
                source: 'Reddit',
                url: `https://reddit.com${postData.permalink}`,
                type: 'social_media',
                timestamp: new Date(postData.created_utc * 1000).toISOString(),
                metadata: {
                  platform: 'Reddit',
                  subreddit: postData.subreddit,
                  score: postData.score,
                  author: postData.author
                }
              });
              
              results.push(content);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse Reddit JSON:', parseError);
        }
      }
      
    } catch (error) {
      console.error(`Website scraping failed for ${source.name}:`, error);
    }
    
    return results;
  }

  private async scrapeSocialMedia(source: ContentSource): Promise<AdvancedScrapedContent[]> {
    // Social media scraping is limited without proper API access
    // This would be expanded with proper API integrations
    console.log(`📱 Social media scraping for ${source.name} requires API integration`);
    return [];
  }

  private async scrapeStreamingPlatform(source: ContentSource): Promise<AdvancedScrapedContent[]> {
    const results: AdvancedScrapedContent[] = [];
    
    try {
      if (source.id === 'soundcloud-monitor') {
        const response = await axios.get(source.url);
        const $ = cheerio.load(response.data);
        
        // Look for Young Ellens tracks
        const soundItems = $('.searchList__item, .sound__item').toArray();
        for (const element of soundItems) {
          const title = $(element).find('.soundTitle__title, h2').text().trim();
          const artist = $(element).find('.soundTitle__username, .soundBadge__title').text().trim();
          const description = $(element).find('.sound__description, .truncatedAudioInfo__content').text().trim();
          
          if (this.isYoungEllensContent(`${title} ${artist} ${description}`)) {
            const content = await this.createAdvancedContent({
              title: `SoundCloud: ${title}`,
              content: description || title,
              source: 'SoundCloud',
              url: source.url,
              type: 'other',
              timestamp: new Date().toISOString(),
              metadata: {
                platform: 'SoundCloud',
                artist: artist
              }
            });
            
            results.push(content);
          }
        }
      }
      
    } catch (error) {
      console.error(`Streaming platform scraping failed for ${source.name}:`, error);
    }
    
    return results;
  }

  private async createAdvancedContent(basicContent: Omit<ScrapedContent, 'metadata'> & { metadata?: any }): Promise<AdvancedScrapedContent> {
    const qualityScore = this.calculateQualityScore(basicContent);
    const similarityHash = this.generateSimilarityHash(basicContent.content);
    const extractedEntities = this.extractEntities(basicContent.content);
    const sentiment = this.analyzeSentiment(basicContent.content);
    const language = this.detectLanguage(basicContent.content);
    
    // Auto-translate non-Dutch content to Dutch
    let translatedContent = undefined;
    if (translationService.needsTranslation(basicContent.content, 'nl')) {
      try {
        const translation = await translationService.translateContent(basicContent.content, 'nl', language);
        if (translation.confidence > 0.5) {
          translatedContent = translation.translatedText;
        }
      } catch (error) {
        console.error(`Translation failed for content from ${basicContent.source}:`, error);
      }
    }
    
    return {
      ...basicContent,
      qualityScore,
      similarityHash,
      extractedEntities,
      sentiment,
      language,
      translatedContent,
      metadata: basicContent.metadata || {}
    };
  }

  private calculateQualityScore(content: Omit<ScrapedContent, 'metadata'>): ContentQualityScore {
    let relevanceScore = 0;
    let authenticityScore = 0;
    let freshnessScore = 0;
    let completenessScore = 0;
    const reasons: string[] = [];

    const lowerContent = `${content.title} ${content.content}`.toLowerCase();

    // Relevance scoring
    const keywordMatches = [
      'young ellens', 'mr cocaine', 'b-negar', 'owo', 'damsko', 
      'amsterdam', '020', 'alleen me wietje', 'henny'
    ].filter(keyword => lowerContent.includes(keyword));
    
    relevanceScore = Math.min(100, keywordMatches.length * 15);
    if (keywordMatches.length > 0) {
      reasons.push(`Contains ${keywordMatches.length} relevant keywords`);
    }

    // Authenticity scoring
    if (lowerContent.includes('young ellens') || lowerContent.includes('youngellens')) {
      authenticityScore += 40;
      reasons.push('Direct Young Ellens mention');
    }
    if (lowerContent.includes('interview') || lowerContent.includes('lyrics')) {
      authenticityScore += 30;
      reasons.push('Primary content type (interview/lyrics)');
    }
    if (lowerContent.includes('amsterdam') || lowerContent.includes('damsko')) {
      authenticityScore += 20;
      reasons.push('Local Amsterdam context');
    }
    if (lowerContent.includes('b-negar') || lowerContent.includes('owo')) {
      authenticityScore += 30;
      reasons.push('Contains signature phrases');
    }

    // Freshness scoring (based on timestamp)
    const contentDate = new Date(content.timestamp);
    const daysSincePublished = (Date.now() - contentDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSincePublished <= 7) {
      freshnessScore = 100;
      reasons.push('Very recent content (< 1 week)');
    } else if (daysSincePublished <= 30) {
      freshnessScore = 80;
      reasons.push('Recent content (< 1 month)');
    } else if (daysSincePublished <= 90) {
      freshnessScore = 60;
      reasons.push('Moderately recent content (< 3 months)');
    } else {
      freshnessScore = Math.max(20, 100 - daysSincePublished / 10);
      reasons.push('Older content');
    }

    // Completeness scoring
    if (content.content.length > 500) {
      completenessScore = 100;
      reasons.push('Comprehensive content length');
    } else if (content.content.length > 200) {
      completenessScore = 75;
      reasons.push('Good content length');
    } else if (content.content.length > 50) {
      completenessScore = 50;
      reasons.push('Moderate content length');
    } else {
      completenessScore = 25;
      reasons.push('Limited content length');
    }

    const overallScore = Math.round(
      (relevanceScore * 0.4 + authenticityScore * 0.3 + freshnessScore * 0.2 + completenessScore * 0.1)
    );

    return {
      relevanceScore,
      authenticityScore,
      freshnessScore,
      completenessScore,
      overallScore,
      reasons
    };
  }

  private generateSimilarityHash(content: string): string {
    // Simple similarity hash based on content words
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .sort()
      .join('');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < words.length; i++) {
      const char = words.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private extractEntities(content: string): AdvancedScrapedContent['extractedEntities'] {
    const lowerContent = content.toLowerCase();
    
    const people: string[] = [];
    const places: string[] = [];
    const events: string[] = [];
    const drugReferences: string[] = [];
    const musicTerms: string[] = [];

    // Extract people (basic pattern matching)
    const peoplePatterns = ['young ellens', 'mr cocaine', 'ellens', 'dj', 'rapper', 'artist'];
    for (const pattern of peoplePatterns) {
      if (lowerContent.includes(pattern)) {
        people.push(pattern);
      }
    }

    // Extract places
    const placePatterns = ['amsterdam', 'damsko', 'dammie', '020', 'nederland', 'holland'];
    for (const pattern of placePatterns) {
      if (lowerContent.includes(pattern)) {
        places.push(pattern);
      }
    }

    // Extract drug references
    const drugPatterns = ['cocaine', 'weed', 'wietje', 'henny', 'hennessy', 'drugs'];
    for (const pattern of drugPatterns) {
      if (lowerContent.includes(pattern)) {
        drugReferences.push(pattern);
      }
    }

    // Extract music terms
    const musicPatterns = ['track', 'album', 'studio', 'beat', 'rap', 'hip-hop', 'muziek', 'song'];
    for (const pattern of musicPatterns) {
      if (lowerContent.includes(pattern)) {
        musicTerms.push(pattern);
      }
    }

    return {
      people: [...new Set(people)],
      places: [...new Set(places)],
      events: [...new Set(events)],
      drugReferences: [...new Set(drugReferences)],
      musicTerms: [...new Set(musicTerms)]
    };
  }

  private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const lowerContent = content.toLowerCase();
    
    const positiveWords = ['good', 'great', 'love', 'amazing', 'fire', 'sick', 'dope', 'fresh'];
    const negativeWords = ['bad', 'hate', 'terrible', 'wack', 'trash', 'boring'];
    
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private detectLanguage(content: string): string {
    const dutchWords = ['en', 'het', 'de', 'van', 'een', 'in', 'is', 'dat', 'hij', 'niet'];
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'];
    
    const words = content.toLowerCase().split(/\s+/);
    const dutchMatches = words.filter(word => dutchWords.includes(word)).length;
    const englishMatches = words.filter(word => englishWords.includes(word)).length;
    
    if (dutchMatches > englishMatches) return 'nl';
    if (englishMatches > dutchMatches) return 'en';
    return 'unknown';
  }

  private async processAndFilterContent(content: AdvancedScrapedContent[]): Promise<AdvancedScrapedContent[]> {
    const filtered: AdvancedScrapedContent[] = [];
    
    for (const item of content) {
      // Use ML-enhanced quality prediction
      const source = this.contentSources.find(s => s.name === item.source);
      if (source) {
        const mlPredictedQuality = mlPatternOptimizer.predictContentQuality(item, source);
        
        // Blend ML prediction with original score
        const finalQualityScore = (item.qualityScore.overallScore * 0.6) + (mlPredictedQuality * 0.4);
        item.qualityScore.overallScore = Math.round(finalQualityScore);
      }
      
      // Quality filter - use dynamic threshold based on ML insights
      const qualityThreshold = this.getDynamicQualityThreshold();
      if (item.qualityScore.overallScore < qualityThreshold) {
        console.log(`⚠️ Filtered low-quality content: ${item.title} (score: ${item.qualityScore.overallScore}, threshold: ${qualityThreshold})`);
        continue;
      }
      
      // Similarity filter - check for duplicates
      const isDuplicate = this.discoveredContent.some(existing => 
        existing.similarityHash === item.similarityHash
      );
      
      if (isDuplicate) {
        console.log(`⚠️ Filtered duplicate content: ${item.title}`);
        continue;
      }
      
      filtered.push(item);
    }
    
    return filtered;
  }

  private async autoIntegrateContent(content: AdvancedScrapedContent[]): Promise<void> {
    for (const item of content) {
      // Auto-integrate high-quality content (score > 80)
      if (item.qualityScore.overallScore > 80) {
        try {
          console.log(`🚀 Auto-integrating high-quality content: ${item.title} (score: ${item.qualityScore.overallScore})`);
          
          // Upload to admin system
          const response = await axios.post('http://localhost:3001/api/admin/content/upload', {
            type: item.type,
            title: item.title,
            content: item.content,
            source: `Auto-discovered: ${item.source}`
          });
          
          if (response.data.success) {
            const contentId = response.data.content.id;
            
            // Auto-analyze
            await axios.post(`http://localhost:3001/api/admin/content/${contentId}/analyze`);
            
            // Auto-integrate
            setTimeout(async () => {
              await axios.post(`http://localhost:3001/api/admin/content/${contentId}/integrate`);
            }, 2000);
          }
          
        } catch (error) {
          console.error(`Failed to auto-integrate content: ${item.title}`, error);
        }
      }
    }
  }

  private isYoungEllensContent(text: string): boolean {
    const lowerText = text.toLowerCase();
    const requiredKeywords = ['young ellens', 'youngellens', 'mr cocaine', 'mr. cocaine'];
    return requiredKeywords.some(keyword => lowerText.includes(keyword));
  }

  private resolveUrl(baseUrl: string, relativeUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).toString();
    } catch {
      return relativeUrl.startsWith('http') ? relativeUrl : baseUrl + relativeUrl;
    }
  }

  private async queueDetailedScraping(url: string, type: string): Promise<void> {
    // Queue URL for detailed scraping
    console.log(`📋 Queued for detailed scraping: ${url} (${type})`);
    // This would be implemented with a proper job queue system
  }

  private broadcastContentDiscovery(content: AdvancedScrapedContent[], sourceName: string): void {
    // Broadcast to admin panels via WebSocket
    const broadcastFunc = (global as any).broadcastToAdmins;
    if (broadcastFunc && typeof broadcastFunc === 'function') {
      broadcastFunc('content_discovered', {
        sourceName,
        contentCount: content.length,
        content: content.slice(0, 5).map(item => ({
          title: item.title,
          source: item.source,
          qualityScore: item.qualityScore.overallScore,
          sentiment: item.sentiment,
          timestamp: item.timestamp
        })),
        totalQualityContent: this.discoveredContent.filter(c => c.qualityScore.overallScore > 80).length,
        timestamp: new Date().toISOString()
      });
    }
  }

  private getDynamicQualityThreshold(): number {
    // Get ML insights to determine optimal quality threshold
    const mlInsights = mlPatternOptimizer.getMLInsights();
    
    // Base threshold
    let threshold = 50;
    
    // Adjust based on recent performance
    if (mlInsights.dataStats.avgEngagementScore > 0.7) {
      // Users are engaging well, can be more selective
      threshold = 60;
    } else if (mlInsights.dataStats.avgEngagementScore < 0.3) {
      // Poor engagement, be less selective to get more content
      threshold = 40;
    }
    
    // Adjust based on content availability
    const recentContentCount = this.discoveredContent.filter(c => 
      Date.now() - new Date(c.timestamp).getTime() < 24 * 60 * 60 * 1000
    ).length;
    
    if (recentContentCount < 5) {
      // Need more content, lower threshold
      threshold = Math.max(30, threshold - 10);
    } else if (recentContentCount > 20) {
      // Plenty of content, can be more selective
      threshold = Math.min(80, threshold + 10);
    }
    
    return threshold;
  }

  // Public API methods
  public getContentSources(): ContentSource[] {
    return [...this.contentSources];
  }

  public addContentSource(source: Omit<ContentSource, 'id'>): string {
    const newSource: ContentSource = {
      ...source,
      id: `custom-${Date.now()}`
    };
    
    this.contentSources.push(newSource);
    
    if (newSource.enabled && this.isMonitoring) {
      this.startSourceMonitoring(newSource);
    }
    
    return newSource.id;
  }

  public toggleContentSource(sourceId: string, enabled: boolean): boolean {
    const source = this.contentSources.find(s => s.id === sourceId);
    if (!source) return false;
    
    source.enabled = enabled;
    
    if (enabled && this.isMonitoring) {
      this.startSourceMonitoring(source);
    } else if (!enabled) {
      const interval = this.monitoringIntervals.get(sourceId);
      if (interval) {
        clearInterval(interval);
        this.monitoringIntervals.delete(sourceId);
      }
    }
    
    return true;
  }

  public getDiscoveredContent(): AdvancedScrapedContent[] {
    return [...this.discoveredContent].sort((a, b) => 
      b.qualityScore.overallScore - a.qualityScore.overallScore
    );
  }

  public getMonitoringStats(): any {
    const mlInsights = mlPatternOptimizer.getMLInsights();
    
    return {
      isMonitoring: this.isMonitoring,
      totalSources: this.contentSources.length,
      enabledSources: this.contentSources.filter(s => s.enabled).length,
      activeSources: this.monitoringIntervals.size,
      totalContentFound: this.discoveredContent.length,
      highQualityContent: this.discoveredContent.filter(c => c.qualityScore.overallScore > 80).length,
      averageQualityScore: this.discoveredContent.length > 0 
        ? Math.round(this.discoveredContent.reduce((sum, c) => sum + c.qualityScore.overallScore, 0) / this.discoveredContent.length)
        : 0,
      currentQualityThreshold: this.getDynamicQualityThreshold(),
      sources: this.contentSources.map(source => ({
        id: source.id,
        name: source.name,
        type: source.type,
        enabled: source.enabled,
        lastChecked: source.lastChecked,
        itemsFound: source.itemsFound || 0,
        successRate: source.successRate || 100,
        optimizedFrequency: source.configuration.updateFrequency
      })),
      mlInsights: {
        modelsStatus: mlInsights.modelsStatus,
        topPatterns: mlInsights.topPatterns,
        dataStats: mlInsights.dataStats
      }
    };
  }
}

// Export singleton instance
export const advancedScraper = AdvancedScraperService.getInstance();