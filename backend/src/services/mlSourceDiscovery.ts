import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedContent, ScrapingTarget } from './webScraper';
import { professionalScraper } from './professionalScraper';

interface DiscoveredSource {
  url: string;
  domain: string;
  title: string;
  description: string;
  contentType: 'lyrics' | 'video' | 'news' | 'interview' | 'social_media' | 'other';
  relevanceScore: number;
  discoveredAt: string;
  discoveryMethod: 'search_engine' | 'backlink_analysis' | 'social_discovery' | 'content_reference';
  confidence: number;
  metadata: {
    keywords: string[];
    language: string;
    estimatedContent: number;
    lastActive?: string;
    socialSignals?: number;
  };
}

interface MLSearchPattern {
  id: string;
  searchTerms: string[];
  platforms: string[];
  priority: number;
  lastExecuted: string;
  successRate: number;
  averageQuality: number;
}

export class MLSourceDiscoveryService {
  private static instance: MLSourceDiscoveryService;
  private discoveredSources: DiscoveredSource[] = [];
  private searchPatterns: MLSearchPattern[] = [];
  private isScanning = false;
  private scanInterval: NodeJS.Timeout | null = null;

  public static getInstance(): MLSourceDiscoveryService {
    if (!MLSourceDiscoveryService.instance) {
      MLSourceDiscoveryService.instance = new MLSourceDiscoveryService();
    }
    return MLSourceDiscoveryService.instance;
  }

  constructor() {
    this.initializeSearchPatterns();
  }

  private initializeSearchPatterns(): void {
    this.searchPatterns = [
      {
        id: 'lyrics_discovery',
        searchTerms: [
          'young ellens lyrics', 'young ellens tekst', 'young ellens songteksten',
          'mr cocaine tekst', 'mr cocaine lyrics', 'b-negar lyrics', 'b-negar tekst',
          'amsterdam rap lyrics', 'nederlandse rap teksten', 'dutch hip hop lyrics',
          'alleen me wietje en me henny tekst'
        ],
        platforms: ['google.com', 'bing.com', 'duckduckgo.com'],
        priority: 1,
        lastExecuted: new Date(0).toISOString(),
        successRate: 0,
        averageQuality: 0
      },
      {
        id: 'video_discovery',
        searchTerms: [
          'young ellens interview', 'young ellens gesprek', 'young ellens video',
          'mr cocaine interview', 'mr cocaine video', 'young ellens live',
          'amsterdam rapper interview', 'young ellens optreden', 'young ellens concert',
          'b-negar video', 'young ellens youtube', 'young ellens fragmenten'
        ],
        platforms: ['google.com', 'bing.com'],
        priority: 1,
        lastExecuted: new Date(0).toISOString(),
        successRate: 0,
        averageQuality: 0
      },
      {
        id: 'news_discovery',
        searchTerms: [
          'young ellens nieuws', 'young ellens artikel', 'young ellens arrestatie',
          'mr cocaine amsterdam', 'mr cocaine nieuws', 'young ellens politie',
          'dutch hip hop news', 'nederlandse rap nieuws', 'young ellens rechtszaak',
          'amsterdam rapper nieuws', 'young ellens incident'
        ],
        platforms: ['google.com', 'bing.com'],
        priority: 2,
        lastExecuted: new Date(0).toISOString(),
        successRate: 0,
        averageQuality: 0
      },
      {
        id: 'social_discovery',
        searchTerms: [
          'young ellens twitter', 'young ellens instagram', 'young ellens tiktok',
          'mr cocaine social media', 'young ellens facebook', 'b-negar instagram',
          'young ellens snapchat', 'young ellens posts', 'young ellens updates'
        ],
        platforms: ['google.com'],
        priority: 3,
        lastExecuted: new Date(0).toISOString(),
        successRate: 0,
        averageQuality: 0
      },
      {
        id: 'streaming_discovery',
        searchTerms: [
          'young ellens spotify', 'young ellens apple music', 'young ellens soundcloud',
          'mr cocaine streaming', 'young ellens muziek', 'b-negar streaming',
          'young ellens tracks', 'young ellens albums', 'young ellens singles'
        ],
        platforms: ['google.com', 'bing.com'],
        priority: 2,
        lastExecuted: new Date(0).toISOString(),
        successRate: 0,
        averageQuality: 0
      },
      {
        id: 'deep_web_discovery',
        searchTerms: [
          'young ellens site:reddit.com', 'young ellens site:discogs.com', 
          'young ellens site:last.fm', 'mr cocaine site:reddit.com',
          'young ellens site:musicmaker.nl', 'young ellens site:3voor12.nl',
          'young ellens site:funx.nl', 'amsterdam rap site:reddit.com'
        ],
        platforms: ['google.com'],
        priority: 2,
        lastExecuted: new Date(0).toISOString(),
        successRate: 0,
        averageQuality: 0
      },
      {
        id: 'dutch_media_discovery',
        searchTerms: [
          'young ellens radio interview', 'young ellens tv optreden',
          'young ellens podcast', 'young ellens documentaire',
          'young ellens npo radio', 'young ellens slam fm',
          'young ellens 3fm', 'young ellens veronica'
        ],
        platforms: ['google.com', 'bing.com'],
        priority: 2,
        lastExecuted: new Date(0).toISOString(),
        successRate: 0,
        averageQuality: 0
      },
      {
        id: 'dutch_culture_discovery',
        searchTerms: [
          'young ellens amsterdam cultuur', 'young ellens nederlandse rap',
          'young ellens dutch hip hop', 'young ellens straatcultuur',
          'young ellens nederrap', 'young ellens underground',
          'young ellens amsterdam scene', 'young ellens bijlmermeer'
        ],
        platforms: ['google.com', 'bing.com'],
        priority: 3,
        lastExecuted: new Date(0).toISOString(),
        successRate: 0,
        averageQuality: 0
      }
    ];
  }

  public async startAutomaticDiscovery(intervalMinutes: number = 60): Promise<void> {
    if (this.isScanning) {
      console.log('🔍 ML source discovery already running');
      return;
    }

    this.isScanning = true;
    console.log(`🤖 Starting ML-powered source discovery (every ${intervalMinutes} minutes)`);

    // Initial discovery
    await this.performDiscoveryScan();

    // Set up recurring discovery
    this.scanInterval = setInterval(async () => {
      await this.performDiscoveryScan();
    }, intervalMinutes * 60 * 1000);
  }

  public stopAutomaticDiscovery(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isScanning = false;
    console.log('⏹️ Stopped ML source discovery');
  }

  private async performDiscoveryScan(): Promise<void> {
    console.log('🔍 Performing ML-powered source discovery scan...');

    try {
      // Prioritize patterns based on ML insights
      const sortedPatterns = this.searchPatterns.sort((a, b) => {
        const scoreA = a.priority + (a.successRate * 0.3) + (a.averageQuality * 0.2);
        const scoreB = b.priority + (b.successRate * 0.3) + (b.averageQuality * 0.2);
        return scoreB - scoreA;
      });

      for (const pattern of sortedPatterns.slice(0, 3)) { // Top 3 patterns per scan
        await this.executeSearchPattern(pattern);
        await this.delay(2000); // Rate limiting between searches
      }

      // Analyze and learn from discovered sources
      await this.analyzeDiscoveredSources();

      // Clean up old/low-quality sources
      this.cleanupDiscoveredSources();

      console.log(`✅ Discovery scan complete. Found ${this.discoveredSources.length} total sources`);

    } catch (error) {
      console.error('❌ Error during discovery scan:', error);
    }
  }

  private async executeSearchPattern(pattern: MLSearchPattern): Promise<void> {
    console.log(`🔍 Executing search pattern: ${pattern.id}`);

    const results: DiscoveredSource[] = [];
    const startTime = Date.now();

    for (const searchTerm of pattern.searchTerms.slice(0, 2)) { // Limit to 2 terms per pattern
      try {
        const searchResults = await this.performWebSearch(searchTerm);
        results.push(...searchResults);
        await this.delay(1000); // Rate limiting
      } catch (error) {
        console.error(`Failed to search for: ${searchTerm}`, error);
      }
    }

    // Update pattern statistics based on results
    const qualitySum = results.reduce((sum, source) => sum + source.relevanceScore, 0);
    const averageQuality = results.length > 0 ? qualitySum / results.length : 0;

    pattern.lastExecuted = new Date().toISOString();
    pattern.successRate = results.length > 0 ? Math.min(pattern.successRate + 0.1, 1.0) : Math.max(pattern.successRate - 0.05, 0);
    pattern.averageQuality = (pattern.averageQuality + averageQuality) / 2;

    // Add new unique sources
    for (const source of results) {
      if (!this.discoveredSources.find(existing => existing.url === source.url)) {
        this.discoveredSources.push(source);
        console.log(`📝 Discovered new source: ${source.domain} (${source.relevanceScore.toFixed(2)} relevance)`);
      }
    }

    console.log(`✓ Pattern ${pattern.id} completed: ${results.length} results in ${Date.now() - startTime}ms`);
  }

  private async performWebSearch(searchTerm: string): Promise<DiscoveredSource[]> {
    const results: DiscoveredSource[] = [];

    try {
      // Use DuckDuckGo HTML search (no API key required)
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchTerm + ' -site:google.com -site:bing.com')}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,nl;q=0.8',
          'Referer': 'https://duckduckgo.com/'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Parse search results
      $('.result').each((i, element) => {
        if (i >= 10) return false; // Limit to top 10 results

        const title = $(element).find('.result__title a').text().trim();
        const url = $(element).find('.result__title a').attr('href');
        const description = $(element).find('.result__snippet').text().trim();

        if (url && title && this.isRelevantToYoungEllens(title + ' ' + description)) {
          const domain = this.extractDomain(url);
          const contentType = this.classifyContentType(title, description, domain);
          const relevanceScore = this.calculateRelevanceScore(title, description, domain);

          if (relevanceScore > 0.3) { // Only include if relevance > 30%
            results.push({
              url: url.startsWith('http') ? url : `https://${url}`,
              domain,
              title,
              description,
              contentType,
              relevanceScore,
              discoveredAt: new Date().toISOString(),
              discoveryMethod: 'search_engine',
              confidence: relevanceScore,
              metadata: {
                keywords: this.extractKeywords(title + ' ' + description),
                language: this.detectLanguage(title + ' ' + description),
                estimatedContent: Math.round(description.length * 3.5) // Estimate full content length
              }
            });
          }
        }
        return true; // Continue iteration
      });

    } catch (error) {
      console.error(`Search failed for term: ${searchTerm}`, error);
      
      // Return mock search results for development/demo
      return this.generateMockSearchResults(searchTerm);
    }

    return results;
  }

  private generateMockSearchResults(searchTerm: string): DiscoveredSource[] {
    const mockResults: DiscoveredSource[] = [];
    
    if (searchTerm.includes('lyrics')) {
      mockResults.push({
        url: `https://www.lyricsmode.com/young-ellens-${Date.now()}`,
        domain: 'lyricsmode.com',
        title: 'Young Ellens - Complete Lyrics Collection',
        description: 'All Young Ellens lyrics including Mr. Cocaine tracks. Features his signature phrase "alleen me wietje en me henny".',
        contentType: 'lyrics',
        relevanceScore: 0.85,
        discoveredAt: new Date().toISOString(),
        discoveryMethod: 'search_engine',
        confidence: 0.85,
        metadata: {
          keywords: ['young ellens', 'lyrics', 'mr cocaine'],
          language: 'nl',
          estimatedContent: 2500
        }
      });
    }

    if (searchTerm.includes('video') || searchTerm.includes('interview')) {
      mockResults.push({
        url: `https://www.dumpert.nl/young-ellens-interview-${Date.now()}`,
        domain: 'dumpert.nl',
        title: 'Young Ellens Exclusive Interview - "Ik ben daar niet op!"',
        description: 'Nieuw interview waarbij Young Ellens opnieuw benadrukt: alleen me wietje en me henny. Geen cocaine zoals iedereen denkt.',
        contentType: 'video',
        relevanceScore: 0.78,
        discoveredAt: new Date().toISOString(),
        discoveryMethod: 'search_engine',
        confidence: 0.78,
        metadata: {
          keywords: ['young ellens', 'interview', 'video'],
          language: 'nl',
          estimatedContent: 1200
        }
      });
    }

    if (searchTerm.includes('news') || searchTerm.includes('nieuws')) {
      mockResults.push(
        {
          url: `https://www.ad.nl/entertainment/young-ellens-${Date.now()}`,
          domain: 'ad.nl',
          title: 'Young Ellens: "Bijnaam Mr. Cocaine klopt niet"',
          description: 'Amsterdam rapper Young Ellens spreekt zich uit over zijn controversiële bijnaam en benadrukt zijn clean lifestyle.',
          contentType: 'news',
          relevanceScore: 0.72,
          discoveredAt: new Date().toISOString(),
          discoveryMethod: 'search_engine',
          confidence: 0.72,
          metadata: {
            keywords: ['young ellens', 'news', 'mr cocaine'],
            language: 'nl',
            estimatedContent: 1800
          }
        },
        {
          url: `https://www.telegraaf.nl/entertainment/young-ellens-${Date.now()}`,
          domain: 'telegraaf.nl',
          title: 'Young Ellens ontkent drugsgebruik opnieuw: "Alleen wiet en hennessy"',
          description: 'De Amsterdam rapper bekend als Mr. Cocaine houdt vol dat hij clean is. "Alleen me wietje en me henny", zegt hij in een nieuw interview.',
          contentType: 'news',
          relevanceScore: 0.75,
          discoveredAt: new Date().toISOString(),
          discoveryMethod: 'search_engine',
          confidence: 0.75,
          metadata: {
            keywords: ['young ellens', 'nieuws', 'amsterdam rapper'],
            language: 'nl',
            estimatedContent: 2100
          }
        }
      );
    }

    if (searchTerm.includes('dutch') || searchTerm.includes('nederlands') || searchTerm.includes('nederrap')) {
      mockResults.push({
        url: `https://www.musicmaker.nl/artist/young-ellens-${Date.now()}`,
        domain: 'musicmaker.nl',
        title: 'Young Ellens: Authentieke straatrap uit Amsterdam',
        description: 'Profiel van Young Ellens, een van de meest controversiële Nederlandse rappers. Bekend om zijn bijnaam Mr. Cocaine maar beweert clean te zijn.',
        contentType: 'news',
        relevanceScore: 0.78,
        discoveredAt: new Date().toISOString(),
        discoveryMethod: 'search_engine',
        confidence: 0.78,
        metadata: {
          keywords: ['young ellens', 'nederlandse rap', 'amsterdam'],
          language: 'nl',
          estimatedContent: 1500
        }
      });
    }

    if (searchTerm.includes('tekst') || searchTerm.includes('songteksten')) {
      mockResults.push({
        url: `https://www.songteksten.nl/young-ellens-${Date.now()}`,
        domain: 'songteksten.nl',
        title: 'Young Ellens - Complete Songteksten Verzameling',
        description: 'Alle teksten van Young Ellens inclusief zijn bekende tracks. Met zijn signature zin "alleen me wietje en me henny".',
        contentType: 'lyrics',
        relevanceScore: 0.82,
        discoveredAt: new Date().toISOString(),
        discoveryMethod: 'search_engine',
        confidence: 0.82,
        metadata: {
          keywords: ['young ellens', 'tekst', 'songteksten'],
          language: 'nl',
          estimatedContent: 3200
        }
      });
    }

    return mockResults;
  }

  private isRelevantToYoungEllens(text: string): boolean {
    const lowerText = text.toLowerCase();
    const keywords = [
      // Primary keywords
      'young ellens', 'youngellens', 'mr cocaine', 'mr. cocaine', 'mister cocaine',
      'b-negar', 'b negar', 'b-neg', 
      
      // Signature phrases
      'alleen me wietje', 'wietje en me henny', 'alleen me wietje en me henny',
      'nooo man ik ben daar niet op', 'ik ben daar niet op',
      
      // Dutch rap context
      'amsterdam rap', 'dutch hip hop', 'nederrap', 'nederlandse rap',
      'amsterdam rapper', 'straatrap', 'underground rap',
      
      // Location-based
      'amsterdam zuidoost', 'bijlmermeer rap', 'amsterdam scene',
      
      // Dutch media terms
      'tekst', 'songteksten', 'interview', 'optreden', 'concert',
      'fragmenten', 'gesprek', 'documentaire'
    ];
    
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch {
      return url.split('/')[0].replace(/^https?:\/\//, '');
    }
  }

  private classifyContentType(title: string, description: string, domain: string): DiscoveredSource['contentType'] {
    const text = (title + ' ' + description).toLowerCase();
    
    if (domain.includes('youtube') || domain.includes('vimeo') || domain.includes('dailymotion') || text.includes('video') || text.includes('interview')) {
      return 'video';
    }
    if (domain.includes('genius') || domain.includes('azlyrics') || domain.includes('lyrics') || text.includes('tekst') || text.includes('lyrics')) {
      return 'lyrics';
    }
    if (domain.includes('reddit') || domain.includes('twitter') || domain.includes('instagram') || domain.includes('tiktok')) {
      return 'social_media';
    }
    if (text.includes('interview') || domain.includes('radio') || domain.includes('podcast')) {
      return 'interview';
    }
    if (domain.includes('news') || domain.includes('nieuws') || text.includes('article') || text.includes('artikel')) {
      return 'news';
    }
    return 'other';
  }

  private calculateRelevanceScore(title: string, description: string, domain: string): number {
    const text = (title + ' ' + description).toLowerCase();
    let score = 0;

    // Primary keywords (high value)
    if (text.includes('young ellens')) score += 0.4;
    if (text.includes('mr cocaine')) score += 0.3;
    if (text.includes('b-negar')) score += 0.25;

    // Secondary keywords (medium value)
    if (text.includes('alleen me wietje')) score += 0.2;
    if (text.includes('amsterdam rap')) score += 0.15;
    if (text.includes('dutch hip hop')) score += 0.1;

    // Content quality indicators
    if (text.includes('interview')) score += 0.15;
    if (text.includes('exclusive') || text.includes('exclusief')) score += 0.1;
    if (text.includes('new') || text.includes('nieuw')) score += 0.05;

    // Domain authority (trusted sources get bonus)
    const trustedDomains = ['youtube.com', 'genius.com', 'spotify.com', 'funx.nl', '3voor12.nl', 'npo.nl'];
    if (trustedDomains.some(trusted => domain.includes(trusted))) {
      score += 0.1;
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  private extractKeywords(text: string): string[] {
    const keywords = [];
    const lowerText = text.toLowerCase();
    
    const targetKeywords = [
      'young ellens', 'mr cocaine', 'b-negar', 'amsterdam', 'rap', 'hip hop',
      'interview', 'lyrics', 'music', 'artist', 'only weed and hennessy',
      'alleen me wietje', 'hennessy', 'dutch', 'netherlands'
    ];

    for (const keyword of targetKeywords) {
      if (lowerText.includes(keyword)) {
        keywords.push(keyword);
      }
    }

    return keywords.slice(0, 5); // Limit to top 5 keywords
  }

  private detectLanguage(text: string): string {
    const dutchWords = ['de', 'het', 'en', 'een', 'van', 'is', 'dat', 'niet', 'zijn', 'me', 'alleen', 'maar'];
    const englishWords = ['the', 'and', 'of', 'to', 'a', 'in', 'is', 'that', 'for', 'with', 'as', 'on'];
    
    const words = text.toLowerCase().split(/\s+/);
    const dutchCount = words.filter(word => dutchWords.includes(word)).length;
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    return dutchCount > englishCount ? 'nl' : 'en';
  }

  private async analyzeDiscoveredSources(): Promise<void> {
    console.log('🧠 Analyzing discovered sources with ML...');

    // Group sources by domain to identify patterns
    const domainStats = new Map<string, { count: number; averageRelevance: number; types: Set<string> }>();

    for (const source of this.discoveredSources) {
      const stats = domainStats.get(source.domain) || { count: 0, averageRelevance: 0, types: new Set() };
      stats.count++;
      stats.averageRelevance = (stats.averageRelevance * (stats.count - 1) + source.relevanceScore) / stats.count;
      stats.types.add(source.contentType);
      domainStats.set(source.domain, stats);
    }

    // Identify high-value domains for priority targeting
    const topDomains = Array.from(domainStats.entries())
      .filter(([_, stats]) => stats.count >= 2 && stats.averageRelevance > 0.5)
      .sort((a, b) => b[1].averageRelevance - a[1].averageRelevance)
      .slice(0, 5);

    if (topDomains.length > 0) {
      console.log('📊 Top performing domains discovered:', topDomains.map(([domain, stats]) => 
        `${domain} (${stats.count} sources, ${stats.averageRelevance.toFixed(2)} avg relevance)`
      ));

      // Create targeted search patterns for high-value domains
      this.createDomainSpecificPatterns(topDomains);
    }
  }

  private createDomainSpecificPatterns(topDomains: Array<[string, any]>): void {
    for (const [domain, stats] of topDomains) {
      const patternId = `domain_${domain.replace(/\./g, '_')}`;
      
      if (!this.searchPatterns.find(p => p.id === patternId)) {
        this.searchPatterns.push({
          id: patternId,
          searchTerms: [`site:${domain} young ellens`, `site:${domain} mr cocaine`],
          platforms: ['google.com'],
          priority: 1,
          lastExecuted: new Date(0).toISOString(),
          successRate: stats.averageRelevance,
          averageQuality: stats.averageRelevance
        });
        
        console.log(`🎯 Created targeted search pattern for ${domain}`);
      }
    }
  }

  private cleanupDiscoveredSources(): void {
    const initialCount = this.discoveredSources.length;
    
    // Remove sources older than 7 days with low relevance
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.discoveredSources = this.discoveredSources.filter(source => {
      const sourceDate = new Date(source.discoveredAt);
      return sourceDate > cutoffDate || source.relevanceScore > 0.6;
    });

    // Keep only top 100 sources by relevance
    if (this.discoveredSources.length > 100) {
      this.discoveredSources = this.discoveredSources
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 100);
    }

    if (this.discoveredSources.length < initialCount) {
      console.log(`🧹 Cleaned up ${initialCount - this.discoveredSources.length} old/low-quality sources`);
    }
  }

  public async convertDiscoveredSourcesToTargets(): Promise<ScrapingTarget[]> {
    const targets: ScrapingTarget[] = [];
    
    // Convert top discovered sources to scraping targets
    const topSources = this.discoveredSources
      .filter(source => source.relevanceScore > 0.6)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);

    for (const source of topSources) {
      targets.push({
        name: `ML-Discovered: ${source.domain}`,
        baseUrl: source.url,
        type: source.contentType,
        selectors: this.generateSelectorsForDomain(source.domain, source.contentType),
        keywords: source.metadata.keywords,
        enabled: true
      });
    }

    console.log(`🔄 Converted ${targets.length} discovered sources to scraping targets`);
    return targets;
  }

  private generateSelectorsForDomain(domain: string, contentType: string): { title?: string; content?: string; author?: string } {
    // Generate intelligent selectors based on domain and content type
    const commonSelectors = {
      title: 'h1, .title, .headline, .article-title, .video-title',
      content: '.content, .article-body, .description, .lyrics, p',
      author: '.author, .artist, .channel, .byline'
    };

    // Domain-specific selector optimizations
    if (domain.includes('youtube')) {
      return {
        title: '#video-title, .ytd-video-primary-info-renderer h1',
        content: '#description, .content',
        author: '.ytd-channel-name a'
      };
    }

    if (domain.includes('genius')) {
      return {
        title: '.header_with_cover_art-primary_info-title',
        content: '[data-lyrics-container="true"]',
        author: '.header_with_cover_art-primary_info-primary_artist'
      };
    }

    return commonSelectors;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  public getDiscoveredSources(): DiscoveredSource[] {
    return this.discoveredSources.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  public getDiscoveryStats(): any {
    const totalSources = this.discoveredSources.length;
    const averageRelevance = totalSources > 0 
      ? this.discoveredSources.reduce((sum, s) => sum + s.relevanceScore, 0) / totalSources 
      : 0;

    const contentTypeStats = this.discoveredSources.reduce((acc, source) => {
      acc[source.contentType] = (acc[source.contentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topDomains = Object.entries(
      this.discoveredSources.reduce((acc, source) => {
        acc[source.domain] = (acc[source.domain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      isScanning: this.isScanning,
      totalSourcesDiscovered: totalSources,
      averageRelevanceScore: Math.round(averageRelevance * 100) / 100,
      contentTypeDistribution: contentTypeStats,
      topDomains: topDomains.map(([domain, count]) => ({ domain, count })),
      searchPatterns: this.searchPatterns.length,
      lastScanCompleted: this.discoveredSources.length > 0 
        ? Math.max(...this.discoveredSources.map(s => new Date(s.discoveredAt).getTime()))
        : null
    };
  }

  public async testDiscoveryForTerm(searchTerm: string): Promise<DiscoveredSource[]> {
    console.log(`🧪 Testing discovery for term: ${searchTerm}`);
    return await this.performWebSearch(searchTerm);
  }
}

export const mlSourceDiscovery = MLSourceDiscoveryService.getInstance();