import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedContent, ScrapingTarget } from './webScraper';

export class ProfessionalScraperService {
  private static instance: ProfessionalScraperService;
  
  public static getInstance(): ProfessionalScraperService {
    if (!ProfessionalScraperService.instance) {
      ProfessionalScraperService.instance = new ProfessionalScraperService();
    }
    return ProfessionalScraperService.instance;
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  private createAdvancedAxiosConfig(url: string) {
    const isYouTube = url.includes('youtube.com');
    const isGenius = url.includes('genius.com');
    const isGoogle = url.includes('google.com');
    
    let referer = 'https://www.google.com/';
    if (isYouTube) referer = 'https://www.google.com/search?q=youtube';
    if (isGenius) referer = 'https://www.google.com/search?q=genius+lyrics';

    return {
      timeout: 20000,
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,nl;q=0.8,de;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'Referer': referer,
        // Additional headers to appear more browser-like
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      maxRedirects: 10,
      validateStatus: (status: number) => status < 500, // Accept 4xx but not 5xx
      // Add response interceptor to handle different content types
      responseType: 'text' as const
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryRequest(url: string, maxRetries: number = 3): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Professional scraper attempt ${attempt}/${maxRetries} for ${url}`);
        
        const config = this.createAdvancedAxiosConfig(url);
        
        // Add jitter to avoid detection
        if (attempt > 1) {
          const jitter = 1000 + Math.random() * 2000;
          console.log(`⏳ Waiting ${Math.round(jitter)}ms before retry...`);
          await this.delay(jitter);
        }
        
        const response = await axios.get(url, config);
        console.log(`✅ Professional scraper success: ${response.status} (${Math.round(response.data.length / 1024)}KB)`);
        return response;
        
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        const message = error.message;
        
        console.log(`❌ Attempt ${attempt} failed: ${status || message}`);
        
        // Handle specific error cases
        if (status === 429) {
          console.log('🚫 Rate limited - will use longer delay');
          if (attempt < maxRetries) {
            await this.delay(5000 + Math.random() * 5000);
          }
        } else if (status === 403) {
          console.log('🔒 Forbidden - might be blocked');
          if (attempt < maxRetries) {
            await this.delay(3000 + Math.random() * 3000);
          }
        } else if (status >= 500) {
          console.log('🚨 Server error - will retry');
          if (attempt < maxRetries) {
            await this.delay(2000 + Math.random() * 2000);
          }
        }
        
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }
    
    throw lastError;
  }

  public async scrapeWithFallback(target: ScrapingTarget): Promise<ScrapedContent[]> {
    try {
      console.log(`🎯 Professional scraping: ${target.name}`);
      
      // Try professional scraping first
      const results = await this.scrapeTarget(target);
      
      if (results.length > 0) {
        console.log(`✅ Professional scraping succeeded for ${target.name}: ${results.length} items`);
        return results;
      } else {
        console.log(`⚠️ No content found, generating mock data for ${target.name}`);
        return this.generateRealisticMockContent(target);
      }
      
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.message || 'Unknown error';
      
      console.log(`❌ Professional scraping failed for ${target.name}: ${status || message}`);
      
      // Return mock content for development/demo purposes
      console.log(`🎭 Using realistic mock content for ${target.name}`);
      return this.generateRealisticMockContent(target);
    }
  }

  private async scrapeTarget(target: ScrapingTarget): Promise<ScrapedContent[]> {
    const response = await this.retryRequest(target.baseUrl);
    const $ = cheerio.load(response.data);
    
    // Use site-specific extraction strategies
    if (target.baseUrl.includes('genius.com')) {
      return this.extractGeniusContent($, target, response.data);
    } else if (target.baseUrl.includes('youtube.com')) {
      return this.extractYouTubeContent($, target, response.data);
    } else if (target.baseUrl.includes('azlyrics.com')) {
      return this.extractAZLyricsContent($, target, response.data);
    } else if (target.baseUrl.includes('hiphopinjesmoel.com')) {
      return this.extractHipHopNewsContent($, target, response.data);
    } else {
      return this.extractGenericContent($, target, response.data);
    }
  }

  private extractGeniusContent($: any, target: ScrapingTarget, html: string): ScrapedContent[] {
    const results: ScrapedContent[] = [];
    
    console.log('🎵 Extracting from Genius...');
    
    // Try multiple selectors for Genius search results
    const selectors = [
      '.mini_card',
      '.search_result',
      '.song_list-item',
      '[class*="SearchResult"]',
      '[class*="SongItem"]'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i: number, element: any): any => {
        if (results.length >= 3) return false;
        
        const titleEl = $(element).find('.mini_card-title, [class*="Title"], h3, h4').first();
        const artistEl = $(element).find('.mini_card-subtitle, [class*="Artist"], .primary_artist').first();
        const snippetEl = $(element).find('.mini_card-snippet, [class*="snippet"]').first();
        
        const title = titleEl.text().trim();
        const artist = artistEl.text().trim();
        const snippet = snippetEl.text().trim();
        
        if (title && this.containsYoungEllensKeywords(`${title} ${artist} ${snippet}`)) {
          results.push({
            title: `${title} ${artist ? `by ${artist}` : ''}`.trim(),
            content: snippet || `Found on Genius: "${title}" contains Young Ellens related content`,
            source: 'Genius Lyrics',
            url: target.baseUrl,
            type: 'lyrics',
            timestamp: new Date().toISOString(),
            metadata: {
              author: artist || 'Young Ellens',
              platform: 'Genius',
              contentLength: snippet.length,
              extractionMethod: 'genius-specific'
            }
          });
        }
      });
      
      if (results.length > 0) break;
    }
    
    return results;
    
    // If no specific results, look for any mention in the page
    if (results.length === 0) {
      const pageText = $.text().toLowerCase();
      if (pageText.includes('young ellens') || pageText.includes('ellens')) {
        results.push({
          title: 'Young Ellens mentioned on Genius',
          content: 'Found references to Young Ellens on the Genius platform',
          source: 'Genius Lyrics',
          url: target.baseUrl,
          type: 'lyrics',
          timestamp: new Date().toISOString(),
          metadata: {
            platform: 'Genius',
            extractionMethod: 'text-search',
            contentLength: 100
          }
        });
      }
    }
    
    console.log(`🎵 Genius extraction complete: ${results.length} results`);
    return results;
  }

  private extractYouTubeContent($: any, target: ScrapingTarget, html: string): ScrapedContent[] {
    const results: ScrapedContent[] = [];
    
    console.log('📺 Extracting from YouTube...');
    
    // YouTube search results can be in various formats
    const selectors = [
      '[id*="video-title"]',
      '.ytd-video-renderer',
      '[class*="video-title"]',
      'h3 a[href*="/watch"]'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i: number, element: any): any => {
        if (results.length >= 2) return false;
        
        const title = $(element).text().trim() || $(element).attr('title') || '';
        const channel = $(element).closest('[class*="renderer"]').find('[class*="channel"], [class*="owner"]').text().trim();
        
        if (title && this.containsYoungEllensKeywords(title)) {
          results.push({
            title: `YouTube: ${title}`,
            content: `Video found on YouTube: "${title}"${channel ? ` from channel: ${channel}` : ''}`,
            source: 'YouTube',
            url: target.baseUrl,
            type: 'video',
            timestamp: new Date().toISOString(),
            metadata: {
              author: channel || 'Unknown Channel',
              platform: 'YouTube',
              contentLength: title.length + (channel?.length || 0),
              extractionMethod: 'youtube-search'
            }
          });
        }
      });
      
      if (results.length > 0) break;
    }
    
    return results;
    
    console.log(`📺 YouTube extraction complete: ${results.length} results`);
    return results;
  }

  private extractAZLyricsContent($: any, target: ScrapingTarget, html: string): ScrapedContent[] {
    const results: ScrapedContent[] = [];
    
    console.log('🎼 Extracting from AZLyrics...');
    
    // AZLyrics has specific structure
    const titleElement = $('.lyricsh, .ringtone').first();
    const lyricsElement = $('.col-xs-12.col-lg-8.text-center div:not(.lyricsh)').first();
    
    const title = titleElement.text().trim();
    const lyrics = lyricsElement.text().trim();
    
    if (lyrics && this.containsYoungEllensKeywords(lyrics)) {
      results.push({
        title: title || 'AZLyrics Song',
        content: lyrics.substring(0, 1000) + (lyrics.length > 1000 ? '...' : ''),
        source: 'AZLyrics',
        url: target.baseUrl,
        type: 'lyrics',
        timestamp: new Date().toISOString(),
        metadata: {
          author: 'Young Ellens',
          platform: 'AZLyrics',
          contentLength: lyrics.length,
          extractionMethod: 'azlyrics-specific'
        }
      });
    }
    
    console.log(`🎼 AZLyrics extraction complete: ${results.length} results`);
    return results;
  }

  private extractHipHopNewsContent($: any, target: ScrapingTarget, html: string): ScrapedContent[] {
    const results: ScrapedContent[] = [];
    
    console.log('📰 Extracting from Hip-Hop news...');
    
    const selectors = [
      'article',
      '.post',
      '.entry',
      '.news-item',
      '.article-content'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i: number, element: any): any => {
        if (results.length >= 2) return false;
        
        const titleEl = $(element).find('h1, h2, h3, .title').first();
        const contentEl = $(element).find('.content, .text, p').first();
        
        const title = titleEl.text().trim();
        const content = contentEl.text().trim();
        
        if ((title || content) && this.containsYoungEllensKeywords(`${title} ${content}`)) {
          results.push({
            title: title || 'Hip-Hop News Article',
            content: content.substring(0, 600) + (content.length > 600 ? '...' : ''),
            source: 'Hip-Hop News',
            url: target.baseUrl,
            type: 'news',
            timestamp: new Date().toISOString(),
            metadata: {
              platform: 'Hip-Hop News',
              contentLength: content.length,
              extractionMethod: 'news-specific'
            }
          });
        }
      });
      
      if (results.length > 0) break;
    }
    
    return results;
    
    console.log(`📰 Hip-Hop news extraction complete: ${results.length} results`);
    return results;
  }

  private extractGenericContent($: any, target: ScrapingTarget, html: string): ScrapedContent[] {
    const results: ScrapedContent[] = [];
    
    console.log('🔍 Generic content extraction...');
    
    const contentSelectors = [
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      'main',
      '.article-body',
      '.text-content'
    ];
    
    for (const selector of contentSelectors) {
      $(selector).each((i: number, element: any): any => {
        if (results.length >= 2) return false;
        
        const text = $(element).text().trim();
        const title = $(element).find('h1, h2, h3').first().text().trim();
        
        if (text.length > 100 && this.containsYoungEllensKeywords(text)) {
          results.push({
            title: title || `Content from ${target.name}`,
            content: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
            source: target.name,
            url: target.baseUrl,
            type: target.type,
            timestamp: new Date().toISOString(),
            metadata: {
              platform: target.name,
              contentLength: text.length,
              extractionMethod: 'generic',
              selector: selector
            }
          });
        }
      });
      
      if (results.length > 0) break;
    }
    
    return results;
    
    console.log(`🔍 Generic extraction complete: ${results.length} results`);
    return results;
  }

  private containsYoungEllensKeywords(text: string): boolean {
    const keywords = [
      'young ellens',
      'ellens',
      'mr cocaine',
      'b-negar',
      'alleen me wietje en me henny',
      'wietje en me henny',
      'amsterdam rap',
      'dutch hip hop',
      'nederrap'
    ];
    
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  private generateRealisticMockContent(target: ScrapingTarget): ScrapedContent[] {
    const mockData: Record<string, ScrapedContent[]> = {
      'Genius Lyrics': [
        {
          title: 'Young Ellens - Mr. Cocaine (Genius)',
          content: 'Nooo man ik ben daar niet op, alleen me wietje en me henny\nB-Negar in de building, Amsterdam represent\nMaar als je het wil weten, ik ken de beste spul\nToch gebruik ik het niet, dat zweer ik je nu',
          source: 'Genius Lyrics',
          url: target.baseUrl,
          type: 'lyrics',
          timestamp: new Date().toISOString(),
          metadata: { author: 'Young Ellens', platform: 'Genius', contentLength: 200, mockData: true }
        }
      ],
      'YouTube Search': [
        {
          title: 'Young Ellens Interview - "Alleen Me Wietje En Me Henny"',
          content: 'In this interview, Young Ellens discusses his music career and repeatedly denies drug use, stating his famous line "Nooo man, ik ben daar niet op, alleen me wietje en me henny"',
          source: 'YouTube',
          url: target.baseUrl,
          type: 'video',
          timestamp: new Date().toISOString(),
          metadata: { author: 'Dutch Hip Hop Channel', platform: 'YouTube', views: 75000, mockData: true }
        }
      ],
      'Dutch Hip-Hop News': [
        {
          title: 'Young Ellens Releases New Track: Still Clean',
          content: 'Young Ellens, also known as Mr. Cocaine, continues to maintain his clean image in his latest release. The Amsterdam rapper emphasizes again: "alleen me wietje en me henny" in his new music.',
          source: 'Hip-Hop News',
          url: target.baseUrl,
          type: 'news',
          timestamp: new Date().toISOString(),
          metadata: { author: 'Music Reporter', platform: 'Hip-Hop News', mockData: true }
        }
      ]
    };

    return mockData[target.name] || [
      {
        title: `Professional Mock: ${target.name}`,
        content: 'Realistic mock content generated by professional scraper. This simulates what would be found in a real scraping scenario with proper anti-detection measures.',
        source: target.name,
        url: target.baseUrl,
        type: target.type,
        timestamp: new Date().toISOString(),
        metadata: { platform: target.name, mockData: true, realistic: true }
      }
    ];
  }
}

export const professionalScraper = ProfessionalScraperService.getInstance();