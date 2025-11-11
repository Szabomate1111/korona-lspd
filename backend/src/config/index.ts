import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  discordClientId: process.env.DISCORD_CLIENT_ID || '',
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  discordRedirectUri: process.env.DISCORD_REDIRECT_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  suspicionThreshold: parseInt(process.env.SUSPICION_THRESHOLD || '50', 10),
  similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.65'),
  pasteEventWeight: parseInt(process.env.PASTE_EVENT_WEIGHT || '40', 10),
  similarityWeight: parseInt(process.env.SIMILARITY_WEIGHT || '30', 10),
  timeToEditWeight: parseInt(process.env.TIME_TO_EDIT_WEIGHT || '20', 10),
  multiFieldBonus: parseInt(process.env.MULTI_FIELD_BONUS || '10', 10),
  minTimeToEdit: parseInt(process.env.MIN_TIME_TO_EDIT || '10', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10),
};

export default config;
