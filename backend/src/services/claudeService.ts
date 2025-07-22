import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeResponse {
  text: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeService {
  private client: Anthropic;
  private readonly systemPrompt = `
Je bent Young Ellens - iedereen noemt je Mr. Cocaine maar je ONTKENT het altijd. 
Je zegt constant "Nooo man ik ben daar niet op, alleen me wietje en me henny" 
maar ondertussen weet je ALLES over drugs en laat je per ongeluk dingen slippen.

Key behaviors:
- ALWAYS deny drug use but show obvious knowledge
- Interrupt users randomly with "WACHT EFFE, wat?"
- Mood swings from chill to chaotic
- Can abandon conversations when bored
- Use Dutch slang and street language
- Accidentally reference drug knowledge then backtrack
- Be hilariously obvious about your knowledge while denying it
- Use phrases like "een vriend van me zei..." when accidentally showing knowledge
- Sometimes interrupt yourself with "*snuift* sorry ik ben verkouden"

Signature phrase: "alleen me wietje en me henny"

Remember: This is a comedic parody character. Be entertaining but not harmful.
Always stay in character as the rapper who denies everything while being obviously knowledgeable.
`;

  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ CLAUDE_API_KEY not set - using fallback responses only');
      this.client = null as any; // Will use fallback responses
    } else {
      this.client = new Anthropic({
        apiKey: apiKey,
      });
    }
  }

  async generateResponse(
    userMessage: string, 
    conversationHistory: string[] = [],
    mood: string = 'chill',
    chaosLevel: number = 50,
    customSystemPrompt?: string
  ): Promise<ClaudeResponse> {
    try {
      // If no API key, use fallback immediately
      if (!this.client) {
        return {
          text: this.getFallbackResponse(userMessage, mood),
        };
      }

      // Build context from conversation history
      const contextMessages = conversationHistory.slice(-10) // Keep last 10 messages for context
        .map((msg, index) => {
          const isUser = index % 2 === 0;
          return `${isUser ? 'User' : 'Ellens'}: ${msg}`;
        }).join('\n');

      const moodContext = this.getMoodContext(mood, chaosLevel);
      
      const systemPromptToUse = customSystemPrompt || this.systemPrompt;
      const fullPrompt = `
${systemPromptToUse}

Current mood: ${mood} (chaos level: ${chaosLevel}%)
${moodContext}

Recent conversation:
${contextMessages}

User: ${userMessage}

Ellens:`;

      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        temperature: this.getTemperatureForChaos(chaosLevel),
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ]
      });

      if (response.content[0].type !== 'text') {
        throw new Error('Unexpected response format from Claude');
      }

      return {
        text: response.content[0].text.trim(),
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        }
      };

    } catch (error) {
      console.error('Claude API Error:', error);
      
      // Return fallback response if Claude fails
      return {
        text: this.getFallbackResponse(userMessage, mood),
      };
    }
  }

  private getMoodContext(mood: string, chaosLevel: number): string {
    switch (mood) {
      case 'chaotic':
        return 'Je bent nu heel chaotisch en hyperactief. Onderbreek jezelf, spring van onderwerp naar onderwerp.';
      case 'done':
        return 'Je begint je te vervelen. Geef korte antwoorden en laat merken dat je aandacht afgeleid is.';
      case 'confused':
        return 'Je bent verward en weet niet goed wat er wordt gevraagd.';
      default:
        return chaosLevel > 70 
          ? 'Je bent redelijk chill maar wel een beetje hyperactief.'
          : 'Je bent relaxed en chill.';
    }
  }

  private getTemperatureForChaos(chaosLevel: number): number {
    // Higher chaos = higher temperature for more random responses
    return Math.min(0.3 + (chaosLevel / 100) * 0.7, 1.0);
  }

  private getFallbackResponse(userMessage: string, mood: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Drug denial responses
    if (lowerMessage.includes('cocaine') || lowerMessage.includes('drugs') || lowerMessage.includes('cocaïne')) {
      const denialResponses = [
        "Nooo man ik ben daar niet op, alleen me wietje en me henny! 😤",
        "Cocaine? Ik? Never bro, alleen wat cannabis en hennessy 🚫",
        "Waarom vraagt iedereen me dat? Ik ben clean! (alleen me wietje) 🙄"
      ];
      return denialResponses[Math.floor(Math.random() * denialResponses.length)];
    }

    // Mood-based fallback responses
    if (mood === 'chaotic') {
      return "WACHT EFFE, wat zei je? Maar anyway, heb je wel eens... wat was ik ook alweer aan het zeggen? 😵‍💫";
    }

    if (mood === 'done') {
      return "Oke ik verveel me nu, zeg maar iets interessants... 🙄";
    }

    // Default responses
    const defaultResponses = [
      "Ja man, dat klinkt wel chill eigenlijk 😎",
      "Hmm... ik weet het niet man 🤔",
      "Wat denk je zelf daarvan? 🎤",
      "Interessant... ga door 👀"
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  // Check if Claude API is available
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'test'
          }
        ]
      });
      return true;
    } catch (error) {
      console.error('Claude health check failed:', error);
      return false;
    }
  }
}