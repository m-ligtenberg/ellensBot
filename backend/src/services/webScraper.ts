import axios from 'axios';
import * as cheerio from 'cheerio';
import { contentLearning } from './contentLearning';

export interface ScrapedContent {
  title: string;
  content: string;
  source: string;
  url: string;
  type: 'lyrics' | 'interview' | 'social_media' | 'news' | 'video' | 'other';
  timestamp: string;
  metadata?: {
    author?: string;
    platform?: string;
    views?: number;
    date?: string;
  };
}

export interface ScrapingTarget {
  name: string;
  baseUrl: string;
  type: ScrapedContent['type'];
  selectors: {
    title?: string;
    content?: string;
    date?: string;
    author?: string;
  };
  keywords: string[];
  enabled: boolean;
}

export class WebScraperService {
  private static instance: WebScraperService;
  private scrapedContent: ScrapedContent[] = [];
  private isRunning = false;
  
  // Predefined scraping targets for Young Ellens content
  private scrapingTargets: ScrapingTarget[] = [
    {
      name: 'Genius Lyrics',
      baseUrl: 'https://genius.com/search?q=young+ellens',
      type: 'lyrics',
      selectors: {
        title: '.header_with_cover_art-primary_info-title',
        content: '[data-lyrics-container="true"]',
        author: '.header_with_cover_art-primary_info-primary_artist'
      },
      keywords: ['young ellens', 'mr cocaine', 'b-negar'],
      enabled: true
    },
    {
      name: 'AZLyrics',
      baseUrl: 'https://www.azlyrics.com/lyrics/youngellens/',
      type: 'lyrics',
      selectors: {
        title: '.lyricsh',
        content: '.col-xs-12.col-lg-8.text-center div:not(.lyricsh)'
      },
      keywords: ['young ellens'],
      enabled: true
    },
    {
      name: 'YouTube Search',
      baseUrl: 'https://www.youtube.com/results?search_query=young+ellens+interview',
      type: 'video',
      selectors: {
        title: '#video-title',
        content: '#description'
      },
      keywords: ['young ellens', 'interview', 'mr cocaine'],
      enabled: true
    },
    {
      name: 'Dutch Hip-Hop News',
      baseUrl: 'https://www.hiphopinjesmoel.com/search?q=young+ellens',
      type: 'news',
      selectors: {
        title: '.article-title, h1, h2',
        content: '.article-content, .content, p'
      },
      keywords: ['young ellens', 'mr cocaine'],
      enabled: true
    },
    {
      name: 'FunX Radio',
      baseUrl: 'https://funx.nl/search?query=young+ellens',
      type: 'interview',
      selectors: {
        title: '.title, h1',
        content: '.description, .content'
      },
      keywords: ['young ellens', 'interview'],
      enabled: true
    }
  ];

  private constructor() {
    this.setupAxiosDefaults();
  }

  public static getInstance(): WebScraperService {
    if (!WebScraperService.instance) {
      WebScraperService.instance = new WebScraperService();
    }
    return WebScraperService.instance;
  }

  private setupAxiosDefaults(): void {
    // Set realistic browser headers to avoid blocking
    axios.defaults.headers.common['User-Agent'] = 
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    axios.defaults.headers.common['Accept'] = 
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
    axios.defaults.headers.common['Accept-Language'] = 'nl-NL,nl;q=0.9,en;q=0.8';
    axios.defaults.timeout = 10000; // 10 second timeout
  }

  public async startScraping(): Promise<{ success: boolean; message: string; results?: ScrapedContent[] }> {
    if (this.isRunning) {
      return { success: false, message: 'Scraper is already running' };
    }

    this.isRunning = true;
    console.log('🕷️ Starting Young Ellens web scraper...');

    try {
      const results: ScrapedContent[] = [];
      
      for (const target of this.scrapingTargets.filter(t => t.enabled)) {
        console.log(`🔍 Scraping: ${target.name}`);
        
        try {
          const targetResults = await this.scrapeTarget(target);
          results.push(...targetResults);
          
          console.log(`✅ Found ${targetResults.length} items from ${target.name}`);
          
          // Rate limiting - wait between requests
          await this.delay(2000);
          
        } catch (error) {
          console.error(`❌ Failed to scrape ${target.name}:`, error);
          continue;
        }
      }

      // Auto-upload and analyze scraped content
      for (const content of results) {
        await this.processScrapedContent(content);
      }

      this.isRunning = false;
      
      return {
        success: true,
        message: `Successfully scraped ${results.length} pieces of content`,
        results
      };

    } catch (error) {
      this.isRunning = false;
      console.error('❌ Scraping failed:', error);
      return {
        success: false,
        message: `Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async scrapeTarget(target: ScrapingTarget): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];
    
    try {
      // Handle different scraping strategies based on target type
      switch (target.type) {
        case 'lyrics':
          return await this.scrapeLyrics(target);
        case 'video':
          return await this.scrapeVideoContent(target);
        case 'news':
        case 'interview':
          return await this.scrapeArticles(target);
        default:
          return await this.scrapeGeneral(target);
      }
    } catch (error) {
      console.error(`Error scraping ${target.name}:`, error);
      return [];
    }
  }

  private async scrapeLyrics(target: ScrapingTarget): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];
    
    try {
      const response = await axios.get(target.baseUrl);
      const $ = cheerio.load(response.data);
      
      // Look for Young Ellens songs
      $('a[href*="young-ellens"], a[href*="youngellens"]').each((i, element) => {
        const link = $(element).attr('href');
        if (link) {
          // Queue individual song pages for scraping
          this.queueSongScrape(this.resolveUrl(target.baseUrl, link), target);
        }
      });

      // If we're on a song page, scrape the lyrics directly
      if (target.baseUrl.includes('/lyrics/') || target.selectors.content) {
        const title = $(target.selectors.title || 'h1').first().text().trim();
        const lyricsContent = $(target.selectors.content || '.lyrics, [data-lyrics-container]').text().trim();
        
        if (title && lyricsContent && this.containsYoungEllensKeywords(title + ' ' + lyricsContent)) {
          results.push({
            title: `Lyrics: ${title}`,
            content: lyricsContent,
            source: target.name,
            url: target.baseUrl,
            type: 'lyrics',
            timestamp: new Date().toISOString(),
            metadata: {
              platform: target.name,
              author: 'Young Ellens'
            }
          });
        }
      }

    } catch (error) {
      console.error(`Failed to scrape lyrics from ${target.name}:`, error);
    }

    return results;
  }

  private async scrapeVideoContent(target: ScrapingTarget): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];
    
    try {
      // YouTube scraping (limited without API)
      const response = await axios.get(target.baseUrl);
      const $ = cheerio.load(response.data);
      
      // Look for video titles and descriptions that mention Young Ellens
      $('[id*="video-title"], .ytd-video-renderer #video-title').each((i, element) => {
        const title = $(element).text().trim();
        const description = $(element).closest('.ytd-video-renderer').find('#description-text').text().trim();
        
        if (this.containsYoungEllensKeywords(title + ' ' + description)) {
          results.push({
            title: `Video: ${title}`,
            content: description || title,
            source: 'YouTube',
            url: target.baseUrl,
            type: 'video',
            timestamp: new Date().toISOString(),
            metadata: {
              platform: 'YouTube'
            }
          });
        }
      });

    } catch (error) {
      console.error('Failed to scrape video content:', error);
    }

    return results;
  }

  private async scrapeArticles(target: ScrapingTarget): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];
    
    try {
      const response = await axios.get(target.baseUrl);
      const $ = cheerio.load(response.data);
      
      // Look for article links
      $('a').each((i, element) => {
        const href = $(element).attr('href');
        const linkText = $(element).text().trim();
        
        if (href && this.containsYoungEllensKeywords(linkText)) {
          // Queue article for detailed scraping
          this.queueArticleScrape(this.resolveUrl(target.baseUrl, href), target);
        }
      });

      // If we're on an article page, scrape it directly
      const title = $(target.selectors.title || 'h1, .title').first().text().trim();
      const content = $(target.selectors.content || '.content, .article, p').map((i, el) => $(el).text()).get().join('\n');
      
      if (title && content && this.containsYoungEllensKeywords(title + ' ' + content)) {
        results.push({
          title: `${target.type === 'interview' ? 'Interview' : 'Article'}: ${title}`,
          content,
          source: target.name,
          url: target.baseUrl,
          type: target.type,
          timestamp: new Date().toISOString(),
          metadata: {
            platform: target.name
          }
        });
      }

    } catch (error) {
      console.error(`Failed to scrape articles from ${target.name}:`, error);
    }

    return results;
  }

  private async scrapeGeneral(target: ScrapingTarget): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];
    
    try {
      const response = await axios.get(target.baseUrl);
      const $ = cheerio.load(response.data);
      
      // General content scraping
      const title = $('title, h1').first().text().trim();
      const content = $('body').text().trim();
      
      if (this.containsYoungEllensKeywords(title + ' ' + content)) {
        results.push({
          title: title || 'Scraped Content',
          content: content.substring(0, 2000), // Limit content size
          source: target.name,
          url: target.baseUrl,
          type: 'other',
          timestamp: new Date().toISOString(),
          metadata: {
            platform: target.name
          }
        });
      }

    } catch (error) {
      console.error(`Failed to scrape general content from ${target.name}:`, error);
    }

    return results;
  }

  private containsYoungEllensKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();
    const keywords = [
      'young ellens', 'youngellens', 'mr cocaine', 'mr. cocaine',
      'b-negar', 'b negar', 'owo', 'alleen me wietje', 'damsko', 'amsterdam rap'
    ];
    
    return keywords.some(keyword => lowerText.includes(keyword));
  }

  private resolveUrl(baseUrl: string, relativeUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).toString();
    } catch {
      return relativeUrl.startsWith('http') ? relativeUrl : baseUrl + relativeUrl;
    }
  }

  private async queueSongScrape(url: string, target: ScrapingTarget): Promise<void> {
    // In a real implementation, this would queue the URL for later processing
    // For now, we'll just log it
    console.log(`📝 Queued song for scraping: ${url}`);
  }

  private async queueArticleScrape(url: string, target: ScrapingTarget): Promise<void> {
    // Queue article for detailed scraping
    console.log(`📄 Queued article for scraping: ${url}`);
  }

  private async processScrapedContent(content: ScrapedContent): Promise<void> {
    try {
      // Auto-upload to the content system
      const response = await axios.post('http://localhost:3001/api/admin/content/upload', {
        type: content.type,
        title: content.title,
        content: content.content,
        source: `Auto-scraped from ${content.source} (${content.url})`
      });

      if (response.data.success) {
        console.log(`📤 Auto-uploaded: ${content.title}`);
        
        // Auto-analyze the content
        const contentId = response.data.content.id;
        await axios.post(`http://localhost:3001/api/admin/content/${contentId}/analyze`);
        console.log(`🧠 Auto-analyzed: ${content.title}`);
        
        // Auto-integrate if analysis was successful
        await this.delay(1000); // Brief pause
        await axios.post(`http://localhost:3001/api/admin/content/${contentId}/integrate`);
        console.log(`🚀 Auto-integrated: ${content.title}`);
      }
    } catch (error) {
      console.error(`Failed to process scraped content: ${content.title}`, error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual scraping methods
  public async scrapeYouTubeSearch(query: string = 'young ellens'): Promise<ScrapedContent[]> {
    console.log(`🔍 Searching YouTube for: ${query}`);
    
    try {
      // Note: This is a simplified approach. For production, use YouTube API
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl);
      const $ = cheerio.load(response.data);
      
      const results: ScrapedContent[] = [];
      
      // Extract video information from search results
      $('[id*="video-title"]').each((i, element) => {
        if (i >= 5) return false; // Limit to first 5 results
        
        const title = $(element).text().trim();
        if (this.containsYoungEllensKeywords(title)) {
          results.push({
            title: `YouTube: ${title}`,
            content: title,
            source: 'YouTube Search',
            url: searchUrl,
            type: 'video',
            timestamp: new Date().toISOString(),
            metadata: {
              platform: 'YouTube',
              author: 'Unknown'
            }
          });
        }
        return true; // Continue iteration
      });

      return results;
    } catch (error) {
      console.error('YouTube search failed:', error);
      return [];
    }
  }

  public async scrapeLyricsWebsites(): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];
    const lyricsWebsites = [
      'https://genius.com/artists/Young-ellens',
      'https://www.azlyrics.com/lyrics/youngellens/',
      'https://www.songteksten.nl/artist/young-ellens'
    ];

    for (const url of lyricsWebsites) {
      try {
        console.log(`🎵 Scraping lyrics from: ${url}`);
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        // Extract song links
        $('a').each((i, element) => {
          const href = $(element).attr('href');
          const linkText = $(element).text();
          
          if (href && linkText && this.containsYoungEllensKeywords(linkText)) {
            // This would queue individual songs for scraping
            console.log(`Found song: ${linkText}`);
          }
        });

        await this.delay(2000); // Rate limiting
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
      }
    }

    return results;
  }

  // Social media scraping (note: most platforms require API keys)
  public async scrapeSocialMedia(): Promise<ScrapedContent[]> {
    console.log('📱 Social media scraping requires API access...');
    
    // Placeholder for social media scraping
    // In production, you would use:
    // - Twitter API v2
    // - Instagram Basic Display API  
    // - TikTok API
    
    return [];
  }

  // Get scraper statistics
  public getScrapingStats(): any {
    return {
      totalTargets: this.scrapingTargets.length,
      enabledTargets: this.scrapingTargets.filter(t => t.enabled).length,
      scrapedContent: this.scrapedContent.length,
      isCurrentlyRunning: this.isRunning,
      targets: this.scrapingTargets.map(t => ({
        name: t.name,
        type: t.type,
        enabled: t.enabled,
        keywords: t.keywords
      }))
    };
  }

  public addScrapingTarget(target: ScrapingTarget): void {
    this.scrapingTargets.push(target);
    console.log(`➕ Added scraping target: ${target.name}`);
  }

  public removeScrapingTarget(name: string): void {
    this.scrapingTargets = this.scrapingTargets.filter(t => t.name !== name);
    console.log(`➖ Removed scraping target: ${name}`);
  }

  public toggleTarget(name: string, enabled: boolean): void {
    const target = this.scrapingTargets.find(t => t.name === name);
    if (target) {
      target.enabled = enabled;
      console.log(`🔄 ${enabled ? 'Enabled' : 'Disabled'} target: ${name}`);
    }
  }
}

// Export singleton instance
export const webScraper = WebScraperService.getInstance();