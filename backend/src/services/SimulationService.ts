import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export interface ActiveSimulation {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network';
  startedAt: Date;
  durationSeconds: number;
  status: 'running' | 'completed' | 'terminated';
  process?: ChildProcess;
}

export class SimulationService {
  private static activeSimulations: Map<string, ActiveSimulation> = new Map();

  static getActiveSimulations(): Omit<ActiveSimulation, 'process'>[] {
    return Array.from(this.activeSimulations.values()).map(({ process, ...rest }) => rest);
  }

  static startSimulation(type: 'cpu' | 'memory' | 'disk' | 'network', durationSeconds: number = 30): ActiveSimulation {
    const simId = `sim_${type}_${Date.now()}`;
    const simScriptPath = path.resolve(__dirname, `../../../simulations/${this.getScriptForType(type)}`);

    console.log(`[SimulationService] Starting safe simulation: ${type} for ${durationSeconds}s`);

    const child = spawn('python3', [simScriptPath, '--duration', durationSeconds.toString()], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    const record: ActiveSimulation = {
      id: simId,
      type,
      startedAt: new Date(),
      durationSeconds,
      status: 'running',
      process: child,
    };

    this.activeSimulations.set(simId, record);

    child.stdout?.on('data', (data) => {
      console.log(`[Simulation:${simId}] ${data.toString().trim()}`);
    });

    child.stderr?.on('data', (data) => {
      console.warn(`[Simulation:${simId}:ERR] ${data.toString().trim()}`);
    });

    child.on('close', (code) => {
      console.log(`[Simulation:${simId}] Finished with exit code ${code}`);
      record.status = 'completed';
      setTimeout(() => this.activeSimulations.delete(simId), 60000);
    });

    // Safety timeout fallback
    setTimeout(() => {
      if (record.status === 'running' && child && !child.killed) {
        console.log(`[Simulation:${simId}] Safety timeout reached. Terminating process.`);
        child.kill('SIGTERM');
        record.status = 'completed';
      }
    }, (durationSeconds + 5) * 1000);

    return record;
  }

  static stopSimulation(simId: string): boolean {
    const sim = this.activeSimulations.get(simId);
    if (sim && sim.process && !sim.process.killed) {
      sim.process.kill('SIGTERM');
      sim.status = 'terminated';
      return true;
    }
    return false;
  }

  private static getScriptForType(type: string): string {
    switch (type) {
      case 'cpu': return 'stress_cpu.py';
      case 'memory': return 'pressure_memory.py';
      case 'disk': return 'fill_disk.py';
      default: return 'stress_cpu.py';
    }
  }
}
