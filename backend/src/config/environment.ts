export interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: string;
  CLAUDE_API_KEY?: string;
  OPENAI_API_KEY?: string;
  DATABASE_URL?: string;
  FRONTEND_URL: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  SESSION_SECRET: string;
}

class EnvironmentValidator {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.validateAndLoad();
  }

  private validateAndLoad(): EnvironmentConfig {
    const requiredVars = ['SESSION_SECRET'];
    const missingVars: string[] = [];

    // Check required environment variables
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.warn(`⚠️ Missing required environment variables: ${missingVars.join(', ')}`);
      console.warn('Using default values for development');
    }

    // Validate API keys
    const hasClaudeKey = !!process.env.CLAUDE_API_KEY;
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

    if (!hasClaudeKey && !hasOpenAIKey) {
      console.warn('⚠️ No AI API keys found. Bot will use fallback responses only.');
    } else if (!hasOpenAIKey) {
      console.log('ℹ️ No OpenAI API key found. Using Claude only.');
    } else if (!hasClaudeKey) {
      console.log('ℹ️ No Claude API key found. Using OpenAI only.');
    } else {
      console.log('✅ Both AI API keys configured');
    }

    return {
      PORT: parseInt(process.env.PORT || '3001', 10),
      NODE_ENV: process.env.NODE_ENV || 'development',
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
      RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      SESSION_SECRET: process.env.SESSION_SECRET || 'fallback-secret-key-for-development-only'
    };
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isDesktop(): boolean {
    return process.env.DEPLOYMENT_MODE === 'desktop';
  }

  public getDeploymentMode(): 'local' | 'production' | 'desktop' {
    return (process.env.DEPLOYMENT_MODE as 'local' | 'production' | 'desktop') || 'local';
  }

  public hasAIKeys(): { claude: boolean; openai: boolean; any: boolean } {
    return {
      claude: !!this.config.CLAUDE_API_KEY,
      openai: !!this.config.OPENAI_API_KEY,
      any: !!(this.config.CLAUDE_API_KEY || this.config.OPENAI_API_KEY)
    };
  }
}

export const environmentConfig = new EnvironmentValidator();
export const env = environmentConfig.getConfig();