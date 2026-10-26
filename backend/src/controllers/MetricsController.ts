import { Request, Response } from 'express';
import { MetricsRepository } from '../repositories/MetricsRepository';
import { AlertService } from '../services/AlertService';
import { MetricSample } from '../types';

export class MetricsController {
  static async ingest(req: Request, res: Response): Promise<void> {
    try {
      const sample: MetricSample = req.body;
      if (!sample.host_id || sample.cpu_utilization === undefined) {
        res.status(400).json({ error: 'Invalid sample payload. host_id and metrics are required.' });
        return;
      }

      // 1. Persist sample in database
      const saved = await MetricsRepository.insert(sample);

      // 2. Evaluate sample rules in background
      AlertService.evaluateSampleRules(saved).catch((err) =>
        console.error('[MetricsController] Error evaluating sample rules:', err)
      );

      res.status(201).json({ success: true, id: saved.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const hostId = (req.query.hostId as string) || (req.params.hostId as string);
      const limit = parseInt((req.query.limit as string) || '150', 10);
      if (!hostId) {
        res.status(400).json({ error: 'hostId query parameter is required.' });
        return;
      }
      const history = await MetricsRepository.findHistoryByHost(hostId, limit);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getLatest(req: Request, res: Response): Promise<void> {
    try {
      const hostId = req.params.hostId || (req.query.hostId as string);
      if (!hostId) {
        res.status(400).json({ error: 'hostId is required.' });
        return;
      }
      const latest = await MetricsRepository.findLatestByHost(hostId);
      res.json(latest || {});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
