import { Request, Response } from 'express';
import { AlertRepository } from '../repositories/AlertRepository';

export class AlertController {
  static async getRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = await AlertRepository.findAllRules();
      res.json(rules);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateRule(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await AlertRepository.updateRule(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Rule not found or invalid updates' });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const logs = await AlertRepository.findRecentLogs(limit);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
