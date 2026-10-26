import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'sentinelmat',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },

  matlab: {
    // Mode: 'docker_octave' (default reliable), 'octave' (local binary), 'matlab' (local binary)
    mode: (process.env.MATLAB_EXEC_MODE || 'docker_octave') as 'docker_octave' | 'octave' | 'matlab',
    codeDir: process.env.MATLAB_CODE_DIR || path.resolve(__dirname, '../../../matlab'),
    octaveDockerImage: process.env.OCTAVE_DOCKER_IMAGE || 'gnuoctave/octave:latest',
    timeoutMs: parseInt(process.env.MATLAB_TIMEOUT_MS || '45000', 10),
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  },

  analysis: {
    intervalSeconds: parseInt(process.env.ANALYSIS_INTERVAL_SEC || '30', 10),
    sampleWindowMinutes: parseInt(process.env.SAMPLE_WINDOW_MINUTES || '60', 10),
    minSamplesRequired: parseInt(process.env.MIN_SAMPLES_REQUIRED || '5', 10),
  }
};
