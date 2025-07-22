import axios from 'axios';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  service: 'libre' | 'google' | 'fallback';
}

export class TranslationService {
  private static instance: TranslationService;
  private readonly LIBRE_TRANSLATE_URL = 'https://libretranslate.de/translate';
  private readonly GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate/v2';

  private constructor() {}

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * Auto-detect language of text
   */
  public detectLanguage(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Dutch language indicators
    const dutchWords = ['en', 'het', 'de', 'van', 'een', 'in', 'is', 'dat', 'hij', 'niet', 'ik', 'voor', 'op', 'maar', 'met'];
    const dutchMatches = dutchWords.filter(word => lowerText.includes(` ${word} `) || lowerText.startsWith(`${word} `) || lowerText.endsWith(` ${word}`)).length;
    
    // English language indicators  
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with', 'for', 'as', 'was', 'on', 'are'];
    const englishMatches = englishWords.filter(word => lowerText.includes(` ${word} `) || lowerText.startsWith(`${word} `) || lowerText.endsWith(` ${word}`)).length;
    
    // French language indicators
    const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son'];
    const frenchMatches = frenchWords.filter(word => lowerText.includes(` ${word} `) || lowerText.startsWith(`${word} `) || lowerText.endsWith(` ${word}`)).length;
    
    // German language indicators
    const germanWords = ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im'];
    const germanMatches = germanWords.filter(word => lowerText.includes(` ${word} `) || lowerText.startsWith(`${word} `) || lowerText.endsWith(` ${word}`)).length;
    
    // Spanish language indicators
    const spanishWords = ['el', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su'];
    const spanishMatches = spanishWords.filter(word => lowerText.includes(` ${word} `) || lowerText.startsWith(`${word} `) || lowerText.endsWith(` ${word}`)).length;

    // Determine most likely language
    const scores = [
      { lang: 'nl', score: dutchMatches },
      { lang: 'en', score: englishMatches },
      { lang: 'fr', score: frenchMatches },
      { lang: 'de', score: germanMatches },
      { lang: 'es', score: spanishMatches }
    ];
    
    const bestMatch = scores.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    );
    
    return bestMatch.score > 0 ? bestMatch.lang : 'unknown';
  }

  /**
   * Translate text using LibreTranslate (free service)
   */
  public async translateWithLibre(
    text: string, 
    sourceLang: string, 
    targetLang: string = 'nl'
  ): Promise<TranslationResult> {
    try {
      const response = await axios.post(this.LIBRE_TRANSLATE_URL, {
        q: text,
        source: sourceLang === 'unknown' ? 'auto' : sourceLang,
        target: targetLang,
        format: 'text'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        originalText: text,
        translatedText: response.data.translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        confidence: 0.8, // LibreTranslate doesn't provide confidence scores
        service: 'libre'
      };
    } catch (error) {
      console.error('LibreTranslate API error:', error);
      throw error;
    }
  }

  /**
   * Translate text using Google Translate API (requires API key)
   */
  public async translateWithGoogle(
    text: string,
    sourceLang: string,
    targetLang: string = 'nl'
  ): Promise<TranslationResult> {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      throw new Error('Google Translate API key not configured');
    }

    try {
      const response = await axios.post(this.GOOGLE_TRANSLATE_URL, {
        q: text,
        source: sourceLang === 'unknown' ? undefined : sourceLang,
        target: targetLang,
        key: apiKey
      }, {
        timeout: 10000
      });

      const translation = response.data.data.translations[0];
      
      return {
        originalText: text,
        translatedText: translation.translatedText,
        sourceLanguage: translation.detectedSourceLanguage || sourceLang,
        targetLanguage: targetLang,
        confidence: 0.9, // Google typically has high confidence
        service: 'google'
      };
    } catch (error) {
      console.error('Google Translate API error:', error);
      throw error;
    }
  }

  /**
   * Fallback translation using simple word substitution for common phrases
   */
  public translateWithFallback(
    text: string,
    sourceLang: string,
    targetLang: string = 'nl'
  ): TranslationResult {
    let translatedText = text;
    
    // English to Dutch common translations
    if (sourceLang === 'en' && targetLang === 'nl') {
      const enToNl: Record<string, string> = {
        'young ellens': 'young ellens',
        'mr cocaine': 'mr cocaine', 
        'cocaine': 'cocaïne',
        'weed': 'wiet',
        'hennessy': 'hennessy',
        'amsterdam': 'amsterdam',
        'rapper': 'rapper',
        'hip-hop': 'hip-hop',
        'music': 'muziek',
        'song': 'nummer',
        'album': 'album',
        'interview': 'interview',
        'lyrics': 'songtekst',
        'studio': 'studio',
        'beat': 'beat',
        'track': 'track',
        'artist': 'artiest',
        'video': 'video',
        'youtube': 'youtube',
        'soundcloud': 'soundcloud',
        'spotify': 'spotify'
      };

      for (const [en, nl] of Object.entries(enToNl)) {
        const regex = new RegExp(`\\b${en}\\b`, 'gi');
        translatedText = translatedText.replace(regex, nl);
      }
    }
    
    // French to Dutch common translations
    if (sourceLang === 'fr' && targetLang === 'nl') {
      const frToNl: Record<string, string> = {
        'jeune': 'jong',
        'musique': 'muziek',
        'chanson': 'nummer',
        'rappeur': 'rapper',
        'artiste': 'artiest',
        'cocaïne': 'cocaïne',
        'cannabis': 'wiet'
      };

      for (const [fr, nl] of Object.entries(frToNl)) {
        const regex = new RegExp(`\\b${fr}\\b`, 'gi');
        translatedText = translatedText.replace(regex, nl);
      }
    }

    return {
      originalText: text,
      translatedText,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      confidence: 0.3, // Low confidence for fallback
      service: 'fallback'
    };
  }

  /**
   * Main translation method with fallback chain
   */
  public async translateContent(
    text: string,
    targetLanguage: string = 'nl',
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    // Skip translation if already in target language
    const detectedLang = sourceLanguage || this.detectLanguage(text);
    if (detectedLang === targetLanguage) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: detectedLang,
        targetLanguage,
        confidence: 1.0,
        service: 'fallback'
      };
    }

    // Skip translation if text is too short or not worth translating
    if (text.length < 10 || /^[\d\s\-_.,!?]+$/.test(text)) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: detectedLang,
        targetLanguage,
        confidence: 1.0,
        service: 'fallback'
      };
    }

    // Try Google Translate first (if API key available)
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      try {
        return await this.translateWithGoogle(text, detectedLang, targetLanguage);
      } catch (error) {
        console.log('Google Translate failed, trying LibreTranslate...');
      }
    }

    // Try LibreTranslate
    try {
      return await this.translateWithLibre(text, detectedLang, targetLanguage);
    } catch (error) {
      console.log('LibreTranslate failed, using fallback translation...');
    }

    // Use fallback method
    return this.translateWithFallback(text, detectedLang, targetLanguage);
  }

  /**
   * Translate multiple texts in batch
   */
  public async translateBatch(
    texts: string[],
    targetLanguage: string = 'nl'
  ): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];
    
    // Process in small batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.translateContent(text, targetLanguage));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error(`Translation batch ${i}-${i + batchSize} failed:`, error);
        
        // Add fallback results for failed batch
        const fallbackResults = batch.map(text => this.translateWithFallback(text, 'unknown', targetLanguage));
        results.push(...fallbackResults);
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Check if translation is needed for Young Ellens content
   */
  public needsTranslation(text: string, targetLanguage: string = 'nl'): boolean {
    const detectedLang = this.detectLanguage(text);
    
    // Don't translate if already in target language
    if (detectedLang === targetLanguage) return false;
    
    // Don't translate very short texts
    if (text.length < 10) return false;
    
    // Don't translate if mostly numbers, punctuation, or special chars
    if (/^[\d\s\-_.,!?@#$%^&*()]+$/.test(text)) return false;
    
    // Don't translate proper names and brand names
    const properNames = ['young ellens', 'mr cocaine', 'b-negar', 'owo', 'hennessy', 'amsterdam', 'damsko', 'dammie'];
    const hasOnlyProperNames = properNames.some(name => 
      text.toLowerCase().replace(/[^a-z\s]/g, '').trim() === name
    );
    
    if (hasOnlyProperNames) return false;
    
    return true;
  }
}

// Export singleton instance
export const translationService = TranslationService.getInstance();