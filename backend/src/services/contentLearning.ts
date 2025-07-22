import { PersonalityPatterns } from './personalityPatterns';

interface ContentAnalysis {
  keyPhrases: string[];
  emotions: string[];
  streetSlang: string[];
  denialPatterns: string[];
  signaturePhrases: string[];
  personalityTraits: {
    chaosLevel: number;
    denialTendency: number;
    streetCredibility: number;
    musicFocus: number;
  };
}

interface LearnedContent {
  id: string;
  type: 'lyrics' | 'interview' | 'social_media' | 'speech' | 'other';
  title: string;
  content: string;
  analysis: ContentAnalysis;
  integratedDate: string;
}

export class ContentLearningService {
  private static instance: ContentLearningService;
  private learnedContent: LearnedContent[] = [];
  private dynamicPatterns: {
    newDenialResponses: string[];
    newKnowledgeSlips: string[];
    newStreetSlang: string[];
    newSignaturePhrases: string[];
    newConversationStarters: string[];
  } = {
    newDenialResponses: [],
    newKnowledgeSlips: [],
    newStreetSlang: [],
    newSignaturePhrases: [],
    newConversationStarters: []
  };

  private constructor() {}

  public static getInstance(): ContentLearningService {
    if (!ContentLearningService.instance) {
      ContentLearningService.instance = new ContentLearningService();
    }
    return ContentLearningService.instance;
  }

  public async integrateContent(
    id: string,
    type: LearnedContent['type'],
    title: string,
    content: string,
    analysis: ContentAnalysis
  ): Promise<void> {
    const learnedItem: LearnedContent = {
      id,
      type,
      title,
      content,
      analysis,
      integratedDate: new Date().toISOString()
    };

    this.learnedContent.push(learnedItem);
    
    // Extract and learn new patterns
    await this.extractPatternsFromContent(content, analysis, type);
    
    console.log(`🧠 Integrated content: ${title}`);
    console.log(`📊 Total learned content items: ${this.learnedContent.length}`);
    console.log(`🎯 New patterns extracted:`, {
      denialResponses: this.dynamicPatterns.newDenialResponses.length,
      knowledgeSlips: this.dynamicPatterns.newKnowledgeSlips.length,
      streetSlang: this.dynamicPatterns.newStreetSlang.length,
      signaturePhrases: this.dynamicPatterns.newSignaturePhrases.length
    });
  }

  private async extractPatternsFromContent(
    content: string,
    analysis: ContentAnalysis,
    type: LearnedContent['type']
  ): Promise<void> {
    const lowerContent = content.toLowerCase();

    // Extract denial patterns from lyrics/interviews
    if (type === 'lyrics' || type === 'interview') {
      this.extractDenialPatternsFromContent(content);
      this.extractKnowledgeSlipsFromContent(content);
    }

    // Extract street slang and signature phrases
    this.extractStreetSlangFromContent(content);
    this.extractSignaturePhrasesFromContent(content);
    
    // Extract conversation starters from social media
    if (type === 'social_media') {
      this.extractConversationStartersFromContent(content);
    }

    // Learn from the analysis results
    this.learnFromAnalysis(analysis);
  }

  private extractDenialPatternsFromContent(content: string): void {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase().trim();
      
      // Look for denial patterns
      if ((lowerSentence.includes('nooit') || lowerSentence.includes('never')) &&
          (lowerSentence.includes('drugs') || lowerSentence.includes('cocaine') || lowerSentence.includes('coke'))) {
        
        // Clean up and create a response pattern
        let denialResponse = sentence.trim();
        
        // Add Young Ellens flair if missing
        if (!denialResponse.toLowerCase().includes('b-negar') && 
            !denialResponse.toLowerCase().includes('owo') && 
            Math.random() < 0.5) {
          denialResponse += ' B-Negar';
        }
        
        if (!denialResponse.includes('😤') && !denialResponse.includes('🚫')) {
          denialResponse += ' 🚫';
        }
        
        if (!this.dynamicPatterns.newDenialResponses.includes(denialResponse)) {
          this.dynamicPatterns.newDenialResponses.push(denialResponse);
        }
      }

      // Look for "alleen wietje" patterns
      if (lowerSentence.includes('alleen') && 
          (lowerSentence.includes('wietje') || lowerSentence.includes('weed') || lowerSentence.includes('henny'))) {
        
        let denialResponse = sentence.trim();
        if (!denialResponse.toLowerCase().includes('b-negar') && Math.random() < 0.6) {
          denialResponse += ' mattie B-Negar';
        }
        
        if (!this.dynamicPatterns.newDenialResponses.includes(denialResponse)) {
          this.dynamicPatterns.newDenialResponses.push(denialResponse);
        }
      }
    });
  }

  private extractKnowledgeSlipsFromContent(content: string): void {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase().trim();
      
      // Look for accidental knowledge slips
      if ((lowerSentence.includes('vriend') || lowerSentence.includes('friend')) &&
          (lowerSentence.includes('dealer') || lowerSentence.includes('verkopen') || lowerSentence.includes('kopen'))) {
        
        let slip = sentence.trim();
        
        // Add ellens-style backtrack
        if (!slip.includes('...') && !slip.includes('eh')) {
          slip += '... eh ik bedoel, je weet zelf mattie 😅';
        }
        
        if (!this.dynamicPatterns.newKnowledgeSlips.includes(slip)) {
          this.dynamicPatterns.newKnowledgeSlips.push(slip);
        }
      }

      // Look for price/quality references
      if ((lowerSentence.includes('prijs') || lowerSentence.includes('quality') || lowerSentence.includes('kwaliteit')) &&
          (lowerSentence.includes('duur') || lowerSentence.includes('goedkoop') || lowerSentence.includes('expensive'))) {
        
        let slip = sentence.trim() + '... niet dat ik het weet natuurlijk sahbi! 😬';
        
        if (!this.dynamicPatterns.newKnowledgeSlips.includes(slip)) {
          this.dynamicPatterns.newKnowledgeSlips.push(slip);
        }
      }
    });
  }

  private extractStreetSlangFromContent(content: string): void {
    // Find potential new street slang terms
    const words = content.toLowerCase().split(/\s+/);
    
    // Look for recurring slang patterns
    const slangCandidates = words.filter(word => {
      return word.length > 2 && 
             word.length < 10 && 
             !PersonalityPatterns.DUTCH_SLANG.expressions.includes(word) &&
             !PersonalityPatterns.DUTCH_SLANG.exclamations.includes(word);
    });

    // Add unique slang candidates
    slangCandidates.forEach(word => {
      if (!this.dynamicPatterns.newStreetSlang.includes(word)) {
        this.dynamicPatterns.newStreetSlang.push(word);
      }
    });
  }

  private extractSignaturePhrasesFromContent(content: string): void {
    const lowerContent = content.toLowerCase();
    
    // Look for repeated phrases that could be signatures
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      
      // Look for potential ad-libs or catchphrases
      if (trimmed.length < 50 && 
          (trimmed.toLowerCase().includes('yo') || 
           trimmed.toLowerCase().includes('man') || 
           trimmed.toLowerCase().includes('bro'))) {
        
        if (!this.dynamicPatterns.newSignaturePhrases.includes(trimmed)) {
          this.dynamicPatterns.newSignaturePhrases.push(trimmed);
        }
      }
    });
  }

  private extractConversationStartersFromContent(content: string): void {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      const lowerSentence = trimmed.toLowerCase();
      
      // Look for questions or conversation starters
      if ((lowerSentence.includes('wat') && lowerSentence.includes('?')) ||
          (lowerSentence.includes('hoe') && lowerSentence.includes('?')) ||
          (lowerSentence.includes('waarom') && lowerSentence.includes('?'))) {
        
        if (!this.dynamicPatterns.newConversationStarters.includes(trimmed)) {
          this.dynamicPatterns.newConversationStarters.push(trimmed);
        }
      }
    });
  }

  private learnFromAnalysis(analysis: ContentAnalysis): void {
    // Integrate street slang from analysis
    analysis.streetSlang.forEach(slang => {
      if (!this.dynamicPatterns.newStreetSlang.includes(slang)) {
        this.dynamicPatterns.newStreetSlang.push(slang);
      }
    });

    // Learn signature phrases
    analysis.signaturePhrases.forEach(phrase => {
      if (!this.dynamicPatterns.newSignaturePhrases.includes(phrase)) {
        this.dynamicPatterns.newSignaturePhrases.push(phrase);
      }
    });
  }

  // Get enhanced responses using learned patterns
  public getEnhancedDenialResponse(): string | null {
    if (this.dynamicPatterns.newDenialResponses.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * this.dynamicPatterns.newDenialResponses.length);
    return this.dynamicPatterns.newDenialResponses[randomIndex];
  }

  public getEnhancedKnowledgeSlip(): string | null {
    if (this.dynamicPatterns.newKnowledgeSlips.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * this.dynamicPatterns.newKnowledgeSlips.length);
    return this.dynamicPatterns.newKnowledgeSlips[randomIndex];
  }

  public getEnhancedConversationStarter(): string | null {
    if (this.dynamicPatterns.newConversationStarters.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * this.dynamicPatterns.newConversationStarters.length);
    return this.dynamicPatterns.newConversationStarters[randomIndex];
  }

  public getLearnedStreetSlang(): string[] {
    return [...this.dynamicPatterns.newStreetSlang];
  }

  public getStatistics(): any {
    return {
      totalLearnedContent: this.learnedContent.length,
      contentByType: {
        lyrics: this.learnedContent.filter(c => c.type === 'lyrics').length,
        interview: this.learnedContent.filter(c => c.type === 'interview').length,
        social_media: this.learnedContent.filter(c => c.type === 'social_media').length,
        speech: this.learnedContent.filter(c => c.type === 'speech').length,
        other: this.learnedContent.filter(c => c.type === 'other').length,
      },
      learnedPatterns: {
        denialResponses: this.dynamicPatterns.newDenialResponses.length,
        knowledgeSlips: this.dynamicPatterns.newKnowledgeSlips.length,
        streetSlang: this.dynamicPatterns.newStreetSlang.length,
        signaturePhrases: this.dynamicPatterns.newSignaturePhrases.length,
        conversationStarters: this.dynamicPatterns.newConversationStarters.length
      },
      recentIntegrations: this.learnedContent
        .sort((a, b) => new Date(b.integratedDate).getTime() - new Date(a.integratedDate).getTime())
        .slice(0, 5)
        .map(c => ({ title: c.title, type: c.type, date: c.integratedDate }))
    };
  }

  // Export learned patterns for backup or transfer
  public exportLearnedPatterns(): any {
    return {
      patterns: this.dynamicPatterns,
      content: this.learnedContent.map(c => ({
        id: c.id,
        type: c.type,
        title: c.title,
        integratedDate: c.integratedDate
      })),
      exportDate: new Date().toISOString()
    };
  }

  // Clear all learned patterns (for testing or reset)
  public clearLearnedPatterns(): void {
    this.learnedContent = [];
    this.dynamicPatterns = {
      newDenialResponses: [],
      newKnowledgeSlips: [],
      newStreetSlang: [],
      newSignaturePhrases: [],
      newConversationStarters: []
    };
    console.log('🔄 Cleared all learned patterns');
  }
}

// Export singleton instance
export const contentLearning = ContentLearningService.getInstance();