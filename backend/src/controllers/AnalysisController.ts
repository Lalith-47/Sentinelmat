import { Request, Response } from 'express';
import { AnalysisService } from '../services/AnalysisService';
import { AnalysisRepository } from '../repositories/AnalysisRepository';
import { AnomalyRepository } from '../repositories/AnomalyRepository';
import { MatlabRunner } from '../matlab/MatlabRunner';

export class AnalysisController {
  static async triggerAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const hostId = (req.body.hostId as string) || (req.query.hostId as string);
      if (!hostId) {
        res.status(400).json({ error: 'hostId is required to trigger analysis.' });
        return;
      }

      const results = await AnalysisService.runAnalysisForHost(hostId);
      if (!results) {
        res.status(422).json({
          error: 'Insufficient metrics collected for this host to compute statistical analysis.',
        });
        return;
      }

      res.json(results);
    } catch (err: any) {
      console.error('[AnalysisController] Failed running MATLAB analysis:', err);
      res.status(500).json({ error: err.message });
    }
  }

  static async getLatest(req: Request, res: Response): Promise<void> {
    try {
      const hostId = (req.query.hostId as string) || req.params.hostId;
      if (!hostId) {
        res.status(400).json({ error: 'hostId is required.' });
        return;
      }
      const latest = await AnalysisRepository.findLatestByHost(hostId);
      res.json(latest);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const hostId = req.query.hostId as string;
      const metricType = req.query.metricType as string;
      const limit = parseInt((req.query.limit as string) || '50', 10);
      if (!hostId) {
        res.status(400).json({ error: 'hostId is required.' });
        return;
      }
      const history = await AnalysisRepository.findHistoryByHost(hostId, metricType, limit);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getAnomalies(req: Request, res: Response): Promise<void> {
    try {
      const hostId = req.query.hostId as string;
      const limit = parseInt((req.query.limit as string) || '100', 10);
      const anomalies = await AnomalyRepository.findRecent(limit, hostId);
      res.json(anomalies);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async checkMatlabHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await MatlabRunner.checkHealth();
      res.json(health);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
