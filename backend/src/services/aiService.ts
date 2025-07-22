import { ChatGptService, ChatGptResponse } from './chatGptService';
import { ClaudeService, ClaudeResponse } from './claudeService';

export interface AIResponse {
  text: string;
  provider: 'chatgpt' | 'claude' | 'fallback';
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
}

export class AIService {
  private chatGptService: ChatGptService;
  private claudeService: ClaudeService;

  constructor() {
    this.chatGptService = new ChatGptService();
    this.claudeService = new ClaudeService();
    
    console.log('🤖 AI Service initialized with ChatGPT primary, Claude fallback');
  }

  async generateResponse(
    userMessage: string, 
    conversationHistory: string[] = [],
    mood: string = 'chill',
    chaosLevel: number = 50,
    systemPrompt?: string
  ): Promise<AIResponse> {
    
    // Try ChatGPT first
    try {
      const chatGptStatus = this.chatGptService.getStatus();
      
      if (chatGptStatus.available) {
        console.log('🚀 Using ChatGPT for response generation');
        const response = await this.chatGptService.generateResponse(
          userMessage, 
          conversationHistory, 
          mood, 
          chaosLevel,
          systemPrompt
        );
        
        // Check if response is actually from ChatGPT or a fallback
        if (response.usage && response.usage.total_tokens > 0) {
          return {
            text: response.text,
            provider: 'chatgpt',
            usage: {
              input_tokens: response.usage.prompt_tokens,
              output_tokens: response.usage.completion_tokens,
              total_tokens: response.usage.total_tokens
            }
          };
        }
        
        // If ChatGPT returned a fallback, try Claude
        console.log('⚠️ ChatGPT returned fallback, trying Claude...');
      } else {
        console.log('⚠️ ChatGPT not available, trying Claude...');
      }
    } catch (error) {
      console.error('❌ ChatGPT failed, trying Claude:', error);
    }

    // Fallback to Claude
    try {
      console.log('🔄 Using Claude as fallback');
      const response = await this.claudeService.generateResponse(
        userMessage, 
        conversationHistory, 
        mood, 
        chaosLevel,
        systemPrompt
      );

      return {
        text: response.text,
        provider: 'claude',
        usage: response.usage ? {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens
        } : undefined
      };
      
    } catch (error) {
      console.error('❌ Claude also failed, using built-in fallback:', error);
    }

    // Final fallback - built-in responses
    console.log('🆘 Using built-in fallback responses');
    return {
      text: this.getBuiltInFallback(userMessage, mood, chaosLevel),
      provider: 'fallback'
    };
  }

  private getBuiltInFallback(userMessage: string, mood: string, chaosLevel: number): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Drug denial responses
    if (lowerMessage.includes('cocaine') || lowerMessage.includes('drugs') || lowerMessage.includes('cocaïne')) {
      const denialResponses = [
        "Nooo man ik ben daar niet op, alleen me wietje en me henny! 😤",
        "Cocaine? Ik? Never bro, alleen wat cannabis en hennessy 🚫",
        "Waarom vraagt iedereen me dat? Ik ben clean! 🙄",
        "Mr. Cocaine? Dat is een bijnaam man! Ik gebruik geen drugs, alleen me groene 🌿"
      ];
      return denialResponses[Math.floor(Math.random() * denialResponses.length)];
    }

    // Interruption responses for high chaos
    if (chaosLevel > 70) {
      const chaoticResponses = [
        "WACHT EFFE, wat? Maar anyway, heb je wel eens een tijger gezien? 🐅",
        "Yo yo yo! *snuift* sorry ik ben verkouden... waar hadden we het over? 🤧",
        "BROOO! Ik dacht net aan... ehh... wat zei je ook alweer? 😵‍💫"
      ];
      return chaoticResponses[Math.floor(Math.random() * chaoticResponses.length)];
    }

    // Boredom responses
    if (mood === 'done') {
      const boredomResponses = [
        "Oke ik verveel me nu, later 🙄",
        "Yo dit wordt saai, heb je iets interessants? 😴",
        "Meh... kunnen we het over iets anders hebben? 💤"
      ];
      return boredomResponses[Math.floor(Math.random() * boredomResponses.length)];
    }

    // Default responses
    const defaultResponses = [
      "Ja man, wat denk je daarvan? 😎",
      "Yo, dat klinkt wel chill eigenlijk 🎵", 
      "Hmm... ik weet het niet man 🤔",
      "Interessant... ga door 👀",
      "Dat herinnert me aan... wacht wat zei je? 😵‍💫"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  // Health check for all services
  async healthCheck(): Promise<{
    chatgpt: { available: boolean; status: string };
    claude: { available: boolean; status: string };
    overall: boolean;
  }> {
    const [chatGptHealth, claudeHealth] = await Promise.all([
      this.chatGptService.healthCheck().catch(() => false),
      this.claudeService.healthCheck().catch(() => false)
    ]);

    const chatGptStatus = this.chatGptService.getStatus();
    
    return {
      chatgpt: { 
        available: chatGptHealth, 
        status: chatGptStatus.available ? 'ready' : 'api_key_missing' 
      },
      claude: { 
        available: claudeHealth, 
        status: claudeHealth ? 'ready' : 'api_key_missing_or_failed'
      },
      overall: chatGptHealth || claudeHealth
    };
  }

  // Get service status
  getServiceStatus(): {
    primary: string;
    fallback: string;
    chatgpt_available: boolean;
    claude_available: boolean;
  } {
    const chatGptStatus = this.chatGptService.getStatus();
    
    return {
      primary: 'ChatGPT (OpenAI GPT-4o-mini)',
      fallback: 'Claude (Anthropic)',
      chatgpt_available: chatGptStatus.available,
      claude_available: true // Claude service always has fallbacks
    };
  }
}

// Export singleton instance
export const aiService = new AIService();