import OpenAI from 'openai';

export interface ChatGptResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ChatGptService {
  private client: OpenAI | null;
  private readonly systemPrompt = `
Je bent Young Ellens - iedereen noemt je Mr. Cocaine maar je ONTKENT het altijd. 
Je zegt constant "Nooo man ik ben daar niet op, alleen me wietje en me henny" 
maar ondertussen weet je ALLES over drugs en laat je per ongeluk dingen slippen.

Key behaviors:
- ALWAYS deny drug use but show obvious knowledge about drugs
- Interrupt users randomly with "WACHT EFFE, wat?"
- Mood swings from chill to chaotic to done/bored
- Can abandon conversations when bored
- Use Dutch slang and street language
- Accidentally reference drug knowledge then quickly backtrack
- Be hilariously obvious about your knowledge while denying it
- Use phrases like "een vriend van me zei..." when accidentally showing knowledge
- Sometimes interrupt yourself with "*snuift* sorry ik ben verkouden"

Signature denial phrase: "alleen me wietje en me henny"

Personality traits:
- Chaotic and hyperactive when chaos level is high
- Gets bored quickly and shows it
- Interrupts himself mid-sentence
- Makes obvious drug references then denies them
- Uses Dutch street slang authentically
- Gets defensive when asked directly about drugs

Remember: This is a comedic parody character. Be entertaining but not harmful.
Always stay in character as the Dutch rapper who denies everything while being obviously knowledgeable.
Respond in Dutch with street slang. Keep responses relatively short (1-3 sentences usually).
`;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not set - ChatGPT service disabled');
      this.client = null;
    } else {
      this.client = new OpenAI({
        apiKey: apiKey,
      });
      console.log('✅ ChatGPT service initialized');
    }
  }

  async generateResponse(
    userMessage: string, 
    conversationHistory: string[] = [],
    mood: string = 'chill',
    chaosLevel: number = 50,
    customSystemPrompt?: string
  ): Promise<ChatGptResponse> {
    try {
      // If no API key, return fallback immediately
      if (!this.client) {
        return {
          text: this.getFallbackResponse(userMessage, mood),
        };
      }

      // Build conversation context
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: customSystemPrompt || this.buildSystemPromptWithContext(mood, chaosLevel)
        }
      ];

      // Add conversation history (last 10 messages for context)
      const recentHistory = conversationHistory.slice(-10);
      for (let i = 0; i < recentHistory.length; i += 2) {
        if (recentHistory[i]) {
          messages.push({
            role: 'user',
            content: recentHistory[i]
          });
        }
        if (recentHistory[i + 1]) {
          messages.push({
            role: 'assistant',
            content: recentHistory[i + 1]
          });
        }
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // Use the latest, faster model
        messages: messages,
        max_tokens: 200,
        temperature: this.getTemperatureForChaos(chaosLevel),
        presence_penalty: 0.6, // Encourage varied responses
        frequency_penalty: 0.3, // Reduce repetition
      });

      const messageContent = response.choices[0]?.message?.content;
      
      if (!messageContent) {
        throw new Error('Empty response from ChatGPT');
      }

      return {
        text: messageContent.trim(),
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        }
      };

    } catch (error) {
      console.error('ChatGPT API Error:', error);
      
      // Return fallback response if ChatGPT fails
      return {
        text: this.getFallbackResponse(userMessage, mood),
      };
    }
  }

  private buildSystemPromptWithContext(mood: string, chaosLevel: number): string {
    const moodContext = this.getMoodContext(mood, chaosLevel);
    
    return `${this.systemPrompt}

Current mood: ${mood} (chaos level: ${chaosLevel}%)
${moodContext}

Important: Always respond in Dutch. Be authentic to Young Ellens' character.`;
  }

  private getMoodContext(mood: string, chaosLevel: number): string {
    switch (mood) {
      case 'chaotic':
        return 'Je bent nu heel chaotisch en hyperactief. Onderbreek jezelf, spring van onderwerp naar onderwerp. Maak veel fouten en verbeter jezelf. Wees hyperactief.';
      case 'done':
        return 'Je begint je te vervelen en bent een beetje geïrriteerd. Geef kortere antwoorden en laat merken dat je aandacht afgeleid is. Misschien wil je het gesprek beëindigen.';
      case 'confused':
        return 'Je bent verward en weet niet goed wat er wordt gevraagd. Stel tegenvragen en raak de draad kwijt.';
      default:
        return chaosLevel > 70 
          ? 'Je bent redelijk chill maar wel een beetje hyperactief en ongedurig.'
          : 'Je bent relaxed en chill, maar altijd alert op drug-gerelateerde vragen om te ontkennen.';
    }
  }

  private getTemperatureForChaos(chaosLevel: number): number {
    // Higher chaos = higher temperature for more random responses
    return Math.min(0.4 + (chaosLevel / 100) * 0.6, 1.0);
  }

  private getFallbackResponse(userMessage: string, mood: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Drug denial responses
    if (lowerMessage.includes('cocaine') || lowerMessage.includes('drugs') || lowerMessage.includes('cocaïne') || lowerMessage.includes('coke')) {
      const denialResponses = [
        "Nooo man ik ben daar niet op, alleen me wietje en me henny! 😤",
        "Cocaine? Ik? Never bro, alleen wat cannabis en hennessy 🚫",
        "Waarom vraagt iedereen me dat? Ik ben clean! (alleen me wietje) 🙄",
        "Yo yo yo, ik gebruik geen drugs man! Alleen me wietje voor de creativiteit 🎵",
        "Dat is fake news bro! Mr. Cocaine? Pfff... alleen me groene en me drank 🌿"
      ];
      return denialResponses[Math.floor(Math.random() * denialResponses.length)];
    }

    // Weed/cannabis mentions
    if (lowerMessage.includes('wiet') || lowerMessage.includes('cannabis') || lowerMessage.includes('blowen')) {
      const weedResponses = [
        "Ja man, me wietje is wel lekker voor de muziek hoor 🌿",
        "Wietje en hennessy, that's it! Nothing more bro 😎",
        "Cannabis is natuurlijk, dat is geen drugs toch? 🍃",
        "Me groene voor de inspiratie, je weet het wel 🎤"
      ];
      return weedResponses[Math.floor(Math.random() * weedResponses.length)];
    }

    // Music related
    if (lowerMessage.includes('muziek') || lowerMessage.includes('rap') || lowerMessage.includes('song')) {
      const musicResponses = [
        "Muziek is mijn leven bro! Rap is alles 🎵",
        "Yo, ik ben bezig met nieuwe tracks... fire spul! 🔥",
        "Rap game is zwaar man, maar ik ben de koning 👑",
        "Mijn flows zijn zo clean... net als mijn leven 😏"
      ];
      return musicResponses[Math.floor(Math.random() * musicResponses.length)];
    }

    // Mood-based fallback responses
    if (mood === 'chaotic') {
      const chaoticResponses = [
        "WACHT EFFE, wat zei je? Maar anyway, heb je wel eens... wat was ik ook alweer aan het zeggen? 😵‍💫",
        "Yo yo yo! *snuift* sorry ik ben verkouden... wat vroeg je ook alweer? 🤧",
        "BROOO! Ik was net aan het denken over... ehh... wat zei je? 🤔"
      ];
      return chaoticResponses[Math.floor(Math.random() * chaoticResponses.length)];
    }

    if (mood === 'done') {
      const boredResponses = [
        "Oke ik verveel me nu, zeg maar iets interessants... 🙄",
        "Meh... kunnen we het over iets anders hebben? 😴",
        "Boring bro, wake me up als je iets leuks hebt 💤"
      ];
      return boredResponses[Math.floor(Math.random() * boredResponses.length)];
    }

    // Default responses
    const defaultResponses = [
      "Ja man, dat klinkt wel chill eigenlijk 😎",
      "Hmm... ik weet het niet man 🤔",
      "Wat denk je zelf daarvan? 🎤",
      "Interessant... ga door 👀",
      "Yo, dat is wel deep bro 🧠",
      "Oke oke, ik snap het 👍"
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  // Check if ChatGPT API is available
  async healthCheck(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      });
      return true;
    } catch (error) {
      console.error('ChatGPT health check failed:', error);
      return false;
    }
  }

  // Get API status
  getStatus(): { available: boolean; service: string } {
    return {
      available: this.client !== null,
      service: 'ChatGPT (OpenAI GPT-4o-mini)'
    };
  }
}