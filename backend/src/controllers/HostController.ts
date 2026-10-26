import { Request, Response } from 'express';
import { HostRepository } from '../repositories/HostRepository';

export class HostController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { id, hostname, ip_address, os_info, cpu_count, total_memory_bytes, total_disk_bytes } = req.body;
      if (!id || !hostname) {
        res.status(400).json({ error: 'Missing required fields: id, hostname' });
        return;
      }
      const host = await HostRepository.upsert({
        id,
        hostname,
        ip_address,
        os_info,
        cpu_count: cpu_count || 1,
        total_memory_bytes: total_memory_bytes || 0,
        total_disk_bytes: total_disk_bytes || 0,
      });
      res.status(201).json(host);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const hosts = await HostRepository.findAll();
      res.json(hosts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const host = await HostRepository.findById(req.params.id);
      if (!host) {
        res.status(404).json({ error: 'Host not found' });
        return;
      }
      res.json(host);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
