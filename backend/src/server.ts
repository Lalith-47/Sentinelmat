import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import apiRouter from './routes/api';
import { AnalysisService } from './services/AnalysisService';
import { pool } from './db';
import { MatlabRunner } from './matlab/MatlabRunner';

const app = express();

// Security and utility middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Structured request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') {
      console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api', apiRouter);

// Centralized Error Handler (Never expose credentials or raw stacks)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ServerError]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// Initialize runner temp directory
MatlabRunner.init();

// Periodic Background MATLAB Analysis Loop
let analysisTimer: NodeJS.Timeout | null = null;
function startPeriodicAnalysis() {
  const intervalMs = config.analysis.intervalSeconds * 1000;
  console.log(`[Scheduler] Initiating periodic MATLAB analysis (interval: ${config.analysis.intervalSeconds}s)`);
  analysisTimer = setInterval(async () => {
    try {
      await AnalysisService.runScheduledAnalyses();
    } catch (err: any) {
      console.error('[Scheduler] Periodic analysis iteration failed:', err.message);
    }
  }, intervalMs);
}

// Start Server
const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`  SentinelMAT Backend Server running on port ${config.port}  `);
  console.log(`  Environment: ${config.nodeEnv}                          `);
  console.log(`  MATLAB Mode: ${config.matlab.mode}                      `);
  console.log(`====================================================`);
  startPeriodicAnalysis();
});

// Graceful Shutdown
function shutdown(signal: string) {
  console.log(`[Server] Received ${signal}. Initiating graceful shutdown...`);
  if (analysisTimer) clearInterval(analysisTimer);
  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    await pool.end();
    console.log('[PostgreSQL] Database pool drained.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;
