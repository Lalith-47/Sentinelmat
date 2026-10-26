import { Router } from 'express';
import { HostController } from '../controllers/HostController';
import { MetricsController } from '../controllers/MetricsController';
import { AnalysisController } from '../controllers/AnalysisController';
import { IncidentController } from '../controllers/IncidentController';
import { AlertController } from '../controllers/AlertController';
import { SimulationController } from '../controllers/SimulationController';
import { checkDbHealth } from '../db';

const router = Router();

// Health checks
router.get('/health', async (req, res) => {
  const dbHealth = await checkDbHealth();
  res.json({
    status: dbHealth.healthy ? 'healthy' : 'degraded',
    service: 'SentinelMAT Backend API',
    timestamp: new Date().toISOString(),
    database: dbHealth,
  });
});
router.get('/health/matlab', AnalysisController.checkMatlabHealth);

// Hosts
router.post('/hosts/register', HostController.register);
router.get('/hosts', HostController.getAll);
router.get('/hosts/:id', HostController.getById);

// Metrics
router.post('/metrics', MetricsController.ingest);
router.get('/metrics/history', MetricsController.getHistory);
router.get('/metrics/latest/:hostId', MetricsController.getLatest);

// MATLAB Numerical Analysis
router.post('/analysis/run', AnalysisController.triggerAnalysis);
router.get('/analysis/latest', AnalysisController.getLatest);
router.get('/analysis/history', AnalysisController.getHistory);
router.get('/anomalies', AnalysisController.getAnomalies);

// Incidents & Alerts
router.get('/incidents', IncidentController.getAll);
router.post('/incidents/:id/acknowledge', IncidentController.acknowledge);
router.post('/incidents/:id/resolve', IncidentController.resolve);
router.get('/alerts/rules', AlertController.getRules);
router.put('/alerts/rules/:id', AlertController.updateRule);
router.get('/notifications', AlertController.getNotifications);

// Controlled Workload Simulation
router.post('/simulation/start', SimulationController.start);
router.get('/simulation/status', SimulationController.getStatus);
router.post('/simulation/stop/:id', SimulationController.stop);

export default router;
