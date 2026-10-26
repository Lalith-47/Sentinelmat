import { Request, Response } from 'express';
import { SimulationService } from '../services/SimulationService';

export class SimulationController {
  static start(req: Request, res: Response): void {
    try {
      const { type, durationSeconds } = req.body;
      if (!type || !['cpu', 'memory', 'disk', 'network'].includes(type)) {
        res.status(400).json({ error: 'Valid simulation type (cpu, memory, disk, network) is required.' });
        return;
      }
      const duration = Math.min(Math.max(parseInt(durationSeconds || '30', 10), 5), 180);
      const sim = SimulationService.startSimulation(type, duration);
      res.status(202).json({
        id: sim.id,
        type: sim.type,
        startedAt: sim.startedAt,
        durationSeconds: sim.durationSeconds,
        status: sim.status,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static getStatus(req: Request, res: Response): void {
    res.json(SimulationService.getActiveSimulations());
  }

  static stop(req: Request, res: Response): void {
    const { id } = req.params;
    const stopped = SimulationService.stopSimulation(id);
    if (!stopped) {
      res.status(404).json({ error: 'Active simulation not found or already terminated.' });
      return;
    }
    res.json({ success: true, id, status: 'terminated' });
  }
}
