import { Request, Response } from 'express';
import { IncidentRepository } from '../repositories/IncidentRepository';
import { IncidentStatus } from '../types';

export class IncidentController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as IncidentStatus;
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const incidents = await IncidentRepository.findAll(status, limit);
      res.json(incidents);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async acknowledge(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { user } = req.body;
      const updated = await IncidentRepository.acknowledge(id, user || 'Engineer');
      if (!updated) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async resolve(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { notes } = req.body;
      const updated = await IncidentRepository.resolve(id, notes || 'Resolved by operator');
      if (!updated) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
