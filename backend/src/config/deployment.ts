import dotenv from 'dotenv';
import path from 'path';

export type DeploymentMode = 'local' | 'production' | 'railway';

// Load environment based on deployment mode
export const loadEnvironment = (mode: DeploymentMode = 'local') => {
  const rootDir = path.resolve(__dirname, '../../../');
  
  switch (mode) {
    case 'local':
      // Load local development environment with hardcoded keys
      const localPath = path.join(rootDir, '.env.local');
      console.log('🔍 Looking for .env.local at:', localPath);
      dotenv.config({ path: localPath });
      console.log('🏠 Loaded local development environment');
      console.log('🔑 OpenAI Key present:', !!process.env.OPENAI_API_KEY);
      console.log('🔑 Claude Key present:', !!process.env.CLAUDE_API_KEY);
      break;
      
    case 'production':
    case 'railway':
      // Load production environment (Railway will override with its own vars)
      dotenv.config({ path: path.join(rootDir, '.env.production') });
      console.log('🚂 Loaded production/Railway environment');
      break;
      
    default:
      // Fallback to default .env
      dotenv.config({ path: path.join(rootDir, '.env') });
      console.log('📄 Loaded default environment');
  }
};

// Auto-detect deployment mode
export const getDeploymentMode = (): DeploymentMode => {
  // Railway sets RAILWAY_ENVIRONMENT
  if (process.env.RAILWAY_ENVIRONMENT) {
    return 'production';
  }
  
  // Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  // Check for explicit mode
  const mode = process.env.DEPLOYMENT_MODE as DeploymentMode;
  if (mode && ['local', 'production', 'railway'].includes(mode)) {
    return mode;
  }
  
  // Default to local
  return 'local';
};

// Configuration helpers
export const getAIConfig = () => {
  const mode = getDeploymentMode();
  
  return {
    mode,
    claude: {
      available: !!process.env.CLAUDE_API_KEY,
      key: process.env.CLAUDE_API_KEY,
    },
    openai: {
      available: !!process.env.OPENAI_API_KEY,
      key: process.env.OPENAI_API_KEY,
    },
    fallbackEnabled: mode === 'local' // Always allow fallback in local dev
  };
};

export const getDatabaseConfig = () => {
  const mode = getDeploymentMode();
  
  return {
    url: process.env.DATABASE_URL,
    useInMemoryFallback: mode === 'local', // Allow in-memory DB for local dev
    ssl: mode === 'production' // Use SSL in production
  };
};