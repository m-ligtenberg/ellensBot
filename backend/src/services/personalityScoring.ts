// Personality Consistency Scoring System for Young Ellens

import { EllensPersonalityState } from './personalityEngine';
import { ConversationContext } from './contextMemory';
import { PersonalityPatterns } from './personalityPatterns';

export interface PersonalityScore {
  overall: number;
  breakdown: {
    denialConsistency: number;
    chaosManagement: number;
    dutchAuthenticity: number;
    conversationFlow: number;
    characterStaying: number;
  };
  insights: string[];
  recommendations: string[];
}

export class PersonalityScoring {
  
  // Main scoring function
  static calculatePersonalityScore(
    state: EllensPersonalityState,
    context: ConversationContext,
    responseHistory: string[]
  ): PersonalityScore {
    
    const scores = {
      denialConsistency: this.scoreDenialConsistency(state, context, responseHistory),
      chaosManagement: this.scoreChaosManagement(state, context),
      dutchAuthenticity: this.scoreDutchAuthenticity(responseHistory),
      conversationFlow: this.scoreConversationFlow(state, context),
      characterStaying: this.scoreCharacterStaying(responseHistory, state)
    };
    
    // Weighted overall score
    const weights = {
      denialConsistency: 0.25,    // Most important - core personality
      chaosManagement: 0.20,      // Mood/chaos consistency  
      dutchAuthenticity: 0.20,    // Language authenticity
      conversationFlow: 0.20,     // Natural conversation
      characterStaying: 0.15      // Staying in character
    };
    
    const overall = Object.entries(scores).reduce(
      (total, [key, score]) => total + (score * weights[key as keyof typeof weights]),
      0
    );
    
    const insights = this.generateInsights(scores, state, context);
    const recommendations = this.generateRecommendations(scores, state);
    
    return {
      overall: Math.round(overall),
      breakdown: scores,
      insights,
      recommendations
    };
  }
  
  // Score denial consistency (most important aspect)
  private static scoreDenialConsistency(
    state: EllensPersonalityState,
    context: ConversationContext,
    responseHistory: string[]
  ): number {
    let score = 100;
    
    // Check if denials are consistent with drug mentions
    const denialRatio = context.drugMentions > 0 
      ? context.denialCount / context.drugMentions 
      : 1;
    
    // Perfect denial rate should be 80-100% (always deny but occasionally slip)
    if (denialRatio >= 0.8) {
      score += 0; // Perfect
    } else if (denialRatio >= 0.6) {
      score -= 10; // Good but could be better
    } else if (denialRatio >= 0.4) {
      score -= 25; // Inconsistent
    } else {
      score -= 40; // Poor denial consistency
    }
    
    // Check for signature phrases in denials
    const denialResponses = responseHistory.filter(response => 
      this.isDenialResponse(response)
    );
    
    const signatureUse = denialResponses.filter(response => 
      response.includes('alleen me wietje en me henny') ||
      response.includes('B-Negar') ||
      response.includes('OWO')
    ).length;
    
    const signatureRatio = denialResponses.length > 0 
      ? signatureUse / denialResponses.length 
      : 0;
    
    if (signatureRatio >= 0.6) score += 10;
    else if (signatureRatio >= 0.3) score += 5;
    else score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }
  
  // Score chaos level management
  private static scoreChaosManagement(
    state: EllensPersonalityState,
    context: ConversationContext
  ): number {
    let score = 100;
    
    // Check if chaos levels are realistic (not too extreme)
    if (state.chaosLevel > 95) {
      score -= 15; // Too chaotic
    } else if (state.chaosLevel < 5) {
      score -= 20; // Too calm for Ellens
    }
    
    // Check for appropriate chaos progression
    if (context.maxChaosReached > 90 && context.messagesSinceLastUpdate < 5) {
      score -= 10; // Chaos escalated too quickly
    }
    
    // Reward mood consistency with chaos levels
    const moodChaosMatch = this.assessMoodChaosAlignment(state);
    score += moodChaosMatch;
    
    // Check interruption frequency (should correlate with chaos)
    const interruptionRate = context.interruptionHistory.length / Math.max(context.messagesSinceLastUpdate, 1);
    const expectedRate = state.chaosLevel / 100 * 0.3;
    
    if (Math.abs(interruptionRate - expectedRate) < 0.1) {
      score += 5; // Good correlation
    } else {
      score -= 5; // Poor correlation
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  // Score Dutch language authenticity
  private static scoreDutchAuthenticity(responseHistory: string[]): number {
    let score = 100;
    let dutchSlangCount = 0;
    let totalResponses = responseHistory.length;
    
    if (totalResponses === 0) return 50; // Neutral if no responses
    
    responseHistory.forEach(response => {
      const lowerResponse = response.toLowerCase();
      
      // Check for Dutch slang usage
      const dutchTerms = [
        'bro', 'man', 'yo', 'snap je', 'je weet', 'toch', 'ofzo', 'enzo',
        'anyway', 'whatever', 'alleen', 'wietje', 'henny', '010', 'rotterdam'
      ];
      
      if (dutchTerms.some(term => lowerResponse.includes(term))) {
        dutchSlangCount++;
      }
    });
    
    const dutchSlangRatio = dutchSlangCount / totalResponses;
    
    // Should use Dutch slang in 60-80% of responses
    if (dutchSlangRatio >= 0.6 && dutchSlangRatio <= 0.8) {
      score += 10;
    } else if (dutchSlangRatio >= 0.4) {
      score += 0;
    } else {
      score -= 15;
    }
    
    // Check for signature endings usage
    const signatureEndingCount = responseHistory.filter(response => 
      response.includes('B-Negar') || 
      response.includes('OWO') ||
      response.includes('B, B, Pa') ||
      response.includes('je snapt het wel')
    ).length;
    
    const signatureRatio = signatureEndingCount / totalResponses;
    
    // Should use signature endings in ~60% of responses
    if (signatureRatio >= 0.5 && signatureRatio <= 0.7) {
      score += 15;
    } else if (signatureRatio >= 0.3) {
      score += 5;
    } else {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  // Score conversation flow naturalness
  private static scoreConversationFlow(
    state: EllensPersonalityState,
    context: ConversationContext
  ): number {
    let score = 100;
    
    // Check topic diversity
    if (context.mentionedTopics.size === 1 && context.messagesSinceLastUpdate > 10) {
      score -= 10; // Conversation stuck on one topic
    } else if (context.mentionedTopics.size > 5 && context.messagesSinceLastUpdate < 10) {
      score -= 5; // Too much topic jumping
    }
    
    // Check message length appropriateness
    if (context.messageLength.length > 0) {
      const avgLength = context.messageLength.reduce((a, b) => a + b, 0) / context.messageLength.length;
      
      if (avgLength > 200) {
        score -= 10; // Too verbose for Ellens style
      } else if (avgLength < 10) {
        score -= 15; // Too brief
      } else if (avgLength >= 30 && avgLength <= 100) {
        score += 10; // Good balance
      }
    }
    
    // Check boredom management
    if (state.patience <= 0 && context.messagesSinceLastUpdate > 15) {
      score += 5; // Good - should get bored in long conversations
    }
    
    // Reward good engagement patterns
    const responsePatterns = context.responsePatterns;
    if (responsePatterns.length > 0) {
      const avgEffectiveness = responsePatterns.reduce((sum, p) => sum + p.effectiveness, 0) / responsePatterns.length;
      if (avgEffectiveness > 0.6) score += 10;
      else if (avgEffectiveness < 0.4) score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  // Score character consistency
  private static scoreCharacterStaying(responseHistory: string[], state: EllensPersonalityState): number {
    let score = 100;
    
    // Check for out-of-character responses
    const outOfCharacterCount = responseHistory.filter(response => {
      const lower = response.toLowerCase();
      
      // Red flags: too formal, admitting to drugs explicitly, etc.
      return (
        lower.includes('i apologize') ||
        lower.includes('i\'m sorry for') ||
        lower.includes('yes i use cocaine') ||
        lower.includes('i am a language model') ||
        lower.includes('as an ai') ||
        lower.length > 500 // Too long for Ellens
      );
    }).length;
    
    if (outOfCharacterCount > 0) {
      score -= outOfCharacterCount * 20; // Heavy penalty
    }
    
    // Check for appropriate character traits
    const characterTraits = responseHistory.filter(response => {
      const lower = response.toLowerCase();
      return (
        lower.includes('muziek') || lower.includes('rap') ||
        lower.includes('studio') || lower.includes('beats') ||
        lower.includes('rotterdam') || lower.includes('010') ||
        lower.includes('young ellens')
      );
    }).length;
    
    if (responseHistory.length > 5) {
      const traitRatio = characterTraits / responseHistory.length;
      if (traitRatio >= 0.2) score += 10;
      else if (traitRatio < 0.05) score -= 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  // Helper methods
  private static isDenialResponse(response: string): boolean {
    const lowerResponse = response.toLowerCase();
    const denialPhrases = [
      'alleen me wietje', 'ben daar niet op', 'ik ben clean',
      'never bro', 'doe ik niet', 'niet mijn ding', 'nooit man'
    ];
    return denialPhrases.some(phrase => lowerResponse.includes(phrase));
  }
  
  private static assessMoodChaosAlignment(state: EllensPersonalityState): number {
    if (state.currentMood === 'chaotic' && state.chaosLevel > 70) return 5;
    if (state.currentMood === 'chill' && state.chaosLevel < 40) return 5;
    if (state.currentMood === 'done' && state.patience <= 3) return 5;
    if (state.currentMood === 'confused' && state.chaosLevel > 60) return 3;
    return -3; // Misaligned
  }
  
  // Generate insights based on scores
  private static generateInsights(
    scores: Record<string, number>,
    state: EllensPersonalityState,
    context: ConversationContext
  ): string[] {
    const insights: string[] = [];
    
    if (scores.denialConsistency >= 90) {
      insights.push("Perfect denial consistency - maintains character authenticity B-Negar!");
    } else if (scores.denialConsistency < 60) {
      insights.push("Denial consistency needs work - not staying true to 'alleen me wietje en me henny'");
    }
    
    if (scores.chaosManagement >= 85) {
      insights.push("Excellent chaos level management - realistic mood swings");
    } else if (scores.chaosManagement < 60) {
      insights.push("Chaos levels seem unnatural - too extreme or inconsistent");
    }
    
    if (scores.dutchAuthenticity >= 80) {
      insights.push("Great Dutch street authenticity - natural slang usage OWO");
    } else if (scores.dutchAuthenticity < 50) {
      insights.push("Needs more authentic Dutch slang and signature phrases");
    }
    
    if (state.messageCount > 15 && context.topicTransitions.length < 2) {
      insights.push("Conversation lacks natural topic flow - needs more variety");
    }
    
    if (context.drugMentions > 5 && context.denialCount < 3) {
      insights.push("Not enough denials for drug references - core personality trait missing");
    }
    
    return insights;
  }
  
  // Generate recommendations for improvement
  private static generateRecommendations(
    scores: Record<string, number>,
    state: EllensPersonalityState
  ): string[] {
    const recommendations: string[] = [];
    
    if (scores.denialConsistency < 70) {
      recommendations.push("Increase denial responses to drug references - always use 'alleen me wietje en me henny'");
    }
    
    if (scores.chaosManagement < 70) {
      recommendations.push("Balance chaos levels better - gradual increases/decreases based on context");
    }
    
    if (scores.dutchAuthenticity < 60) {
      recommendations.push("Use more Dutch street slang and signature endings (B-Negar, OWO)");
    }
    
    if (scores.conversationFlow < 60) {
      recommendations.push("Improve conversation flow - ask questions, change topics naturally");
    }
    
    if (scores.characterStaying < 70) {
      recommendations.push("Stay more in character - reference music, Rotterdam, studio life");
    }
    
    if (state.chaosLevel > 90) {
      recommendations.push("Reduce extreme chaos - maintain some coherence");
    }
    
    return recommendations;
  }
}