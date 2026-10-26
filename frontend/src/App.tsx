import React, { useState, useEffect, useCallback } from 'react';
import { api, isForceDemoMode } from './services/api';
import {
  Host,
  MetricSample,
  MatlabPipelineOutput,
  AnomalyRecord,
  IncidentRecord,
  AlertRule,
  SimulationItem,
  HostStatus,
} from './types';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { MetricsOverview } from './components/MetricsOverview';
import { TelemetryChart } from './components/TelemetryChart';
import { ForecastChart } from './components/ForecastChart';
import { MatlabStatsTable } from './components/MatlabStatsTable';
import { AnomaliesList } from './components/AnomaliesList';
import { IncidentsView } from './components/IncidentsView';
import { AlertRulesView } from './components/AlertRulesView';
import { SimulationPanel } from './components/SimulationPanel';
import { ConnectionModal } from './components/ConnectionModal';
import {
  Activity,
  Calculator,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Bell,
  Flame,
} from 'lucide-react';

export const App: React.FC = () => {
  // Theme Management (Light vs Dark)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('sentinelmat_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  // Connection Bridge Modal State
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(isForceDemoMode());

  // Parallax Ambient Coordinates
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  // Core Monitoring Data
  const [hosts, setHosts] = useState<Host[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string>('');
  const [latestSample, setLatestSample] = useState<MetricSample | undefined>();
  const [history, setHistory] = useState<MetricSample[]>([]);
  const [analysis, setAnalysis] = useState<MatlabPipelineOutput | undefined>();
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [simulations, setSimulations] = useState<SimulationItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'matlab' | 'forecast' | 'anomalies' | 'incidents' | 'rules' | 'simulation'
  >('overview');

  // Apply Theme to document HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sentinelmat_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Global Mouse Move Listener for Parallax Ambient Glows & Card Sheen
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const xRatio = (e.clientX / window.innerWidth - 0.5) * 40;
      const yRatio = (e.clientY / window.innerHeight - 0.5) * 40;
      setParallaxOffset({ x: xRatio, y: yRatio });

      // Update CSS variables for cards
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Load initial hosts list
  const loadHosts = useCallback(async () => {
    try {
      const data = await api.getHosts();
      setHosts(data);
      if (data.length > 0 && !selectedHostId) {
        setSelectedHostId(data[0].id);
      }
    } catch (err) {
      console.warn('[App] Error fetching hosts:', err);
    }
  }, [selectedHostId]);

  // Load telemetry and analysis for selected host
  const loadHostData = useCallback(async () => {
    if (!selectedHostId) return;
    try {
      const [hist, anomList, incList, ruleList, simList, latestAnalysis] = await Promise.all([
        api.getHistory(selectedHostId, 100),
        api.getAnomalies(selectedHostId),
        api.getIncidents(),
        api.getAlertRules(),
        api.getSimulationStatus(),
        api.getLatestAnalysis(selectedHostId),
      ]);

      setHistory(hist);
      if (hist.length > 0) {
        setLatestSample(hist[hist.length - 1]);
      }
      setAnomalies(anomList);
      setIncidents(incList);
      setRules(ruleList);
      setSimulations(simList);
      if (latestAnalysis) {
        setAnalysis(latestAnalysis);
      }
    } catch (err) {
      console.warn('[App] Error loading host data:', err);
    }
  }, [selectedHostId]);

  // Initial load
  useEffect(() => {
    loadHosts();
  }, [loadHosts]);

  // Telemetry refresh polling loop (every 1.5 seconds for live pulse)
  useEffect(() => {
    loadHostData();
    const interval = setInterval(loadHostData, 1500);
    return () => clearInterval(interval);
  }, [loadHostData]);

  // Trigger MATLAB Analysis handler
  const handleTriggerAnalysis = async () => {
    if (!selectedHostId) return;
    setIsAnalyzing(true);
    try {
      const res = await api.triggerMatlabAnalysis(selectedHostId);
      setAnalysis(res);
      await loadHostData();
    } catch (err: any) {
      console.error('[App] MATLAB Analysis Error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Incident Lifecycle handlers
  const handleAcknowledge = async (id: number, user: string) => {
    await api.acknowledgeIncident(id, user);
    await loadHostData();
  };

  const handleResolve = async (id: number, notes: string) => {
    await api.resolveIncident(id, notes);
    await loadHostData();
  };

  // Rule configuration handlers
  const handleToggleRule = async (id: number, enabled: boolean) => {
    await api.updateAlertRule(id, { enabled });
    await loadHostData();
  };

  const handleToggleTelegram = async (id: number, notify: boolean) => {
    await api.updateAlertRule(id, { notify_telegram: notify });
    await loadHostData();
  };

  // Simulation handlers
  const handleStartSimulation = async (type: 'cpu' | 'memory' | 'disk' | 'network', duration: number) => {
    await api.startSimulation(type, duration);
    await loadHostData();
  };

  const handleStopSimulation = async (id: string) => {
    await api.stopSimulation(id);
    await loadHostData();
  };

  const handleConnectionChange = () => {
    setIsDemoMode(isForceDemoMode());
    loadHosts();
    loadHostData();
  };

  // Compute host record and health state
  const hostRecord = hosts.find((h) => h.id === selectedHostId) || hosts[0];
  const healthState: HostStatus = hostRecord ? hostRecord.status : 'online';

  const diskHistorical = history.map((s) => s.disk_utilization);
  const currentDiskForecast = analysis?.metrics?.disk?.forecast;
  const currentDiskEval = analysis?.metrics?.disk?.evaluation;

  return (
    <div className="app-shell">
      {/* Parallax Ambient Depth Canvas */}
      <div className="parallax-canvas">
        <div
          className="ambient-orb ambient-orb-1"
          style={{
            transform: `translate3d(${parallaxOffset.x * 1.2}px, ${parallaxOffset.y * 1.2}px, 0)`,
          }}
        />
        <div
          className="ambient-orb ambient-orb-2"
          style={{
            transform: `translate3d(${-parallaxOffset.x * 0.8}px, ${-parallaxOffset.y * 0.8}px, 0)`,
          }}
        />
        <div
          className="ambient-orb ambient-orb-3"
          style={{
            transform: `translate3d(${parallaxOffset.x * 0.5}px, ${parallaxOffset.y * 0.5}px, 0)`,
          }}
        />
        <div className="parallax-grid-overlay" />
      </div>

      {/* Global Top Navbar */}
      <Header
        hosts={hosts}
        selectedHostId={selectedHostId}
        onSelectHost={setSelectedHostId}
        healthState={healthState}
        lastSampleTime={latestSample?.timestamp}
        isAnalyzing={isAnalyzing}
        onTriggerAnalysis={handleTriggerAnalysis}
        matlabEngineInfo={analysis?.engineInfo}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        isDemoMode={isDemoMode}
      />

      {/* Main Content Area */}
      <main className="app-main">
        {/* Apple Pro Hero Keynote Section with 3D Holographic Card */}
        <HeroSection
          latestSample={latestSample}
          host={hostRecord}
          onExploreMetrics={() => {
            const el = document.getElementById('telemetry-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onTriggerAnalysis={handleTriggerAnalysis}
          isAnalyzing={isAnalyzing}
        />

        {/* Real-time Hardware Telemetry Bento Grid */}
        <div id="telemetry-section">
          <MetricsOverview sample={latestSample} />
        </div>

        {/* Navigation Tabs (Apple Cupertino Segmented Control) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            paddingTop: 8,
          }}
        >
          <div className="segmented-control" style={{ maxWidth: '100%' }}>
            <button
              className={`segmented-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Activity size={15} />
              <span>Telemetry Stream</span>
            </button>

            <button
              className={`segmented-tab ${activeTab === 'forecast' ? 'active' : ''}`}
              onClick={() => setActiveTab('forecast')}
            >
              <TrendingUp size={15} />
              <span>Capacity Forecast (TTE)</span>
            </button>

            <button
              className={`segmented-tab ${activeTab === 'matlab' ? 'active' : ''}`}
              onClick={() => setActiveTab('matlab')}
            >
              <Calculator size={15} />
              <span>MATLAB Statistics</span>
            </button>

            <button
              className={`segmented-tab ${activeTab === 'anomalies' ? 'active' : ''}`}
              onClick={() => setActiveTab('anomalies')}
            >
              <AlertTriangle size={15} />
              <span>Anomalies ({anomalies.length})</span>
            </button>

            <button
              className={`segmented-tab ${activeTab === 'incidents' ? 'active' : ''}`}
              onClick={() => setActiveTab('incidents')}
            >
              <ShieldAlert size={15} />
              <span>Incidents ({incidents.filter((i) => i.status !== 'resolved').length})</span>
            </button>

            <button
              className={`segmented-tab ${activeTab === 'rules' ? 'active' : ''}`}
              onClick={() => setActiveTab('rules')}
            >
              <Bell size={15} />
              <span>Guardrails</span>
            </button>

            <button
              className={`segmented-tab ${activeTab === 'simulation' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulation')}
            >
              <Flame size={15} color="var(--accent-amber)" />
              <span>Fault Simulation</span>
            </button>
          </div>
        </div>

        {/* Active Tab Panel */}
        <div style={{ minHeight: 380 }}>
          {activeTab === 'overview' && (
            <TelemetryChart samples={history} stats={analysis?.metrics?.cpu?.stats} />
          )}

          {activeTab === 'forecast' && (
            <ForecastChart
              forecast={currentDiskForecast}
              evaluation={currentDiskEval}
              historicalValues={diskHistorical}
              metricTitle="Storage Capacity Exhaustion Model (MATLAB OLS)"
            />
          )}

          {activeTab === 'matlab' && <MatlabStatsTable analysis={analysis} />}

          {activeTab === 'anomalies' && <AnomaliesList anomalies={anomalies} />}

          {activeTab === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          )}

          {activeTab === 'rules' && (
            <AlertRulesView
              rules={rules}
              onToggleRule={handleToggleRule}
              onToggleTelegram={handleToggleTelegram}
            />
          )}

          {activeTab === 'simulation' && (
            <SimulationPanel
              activeSimulations={simulations}
              onStartSimulation={handleStartSimulation}
              onStopSimulation={handleStopSimulation}
            />
          )}
        </div>
      </main>

      {/* Connection & Vercel Bridge Modal */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onConnectionChange={handleConnectionChange}
      />

      {/* Global Apple-tier Footer */}
      <footer className="apple-footer">
        <div className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>SentinelMAT</span>
            <span>&bull;</span>
            <span>Industrial Linux Kernel Telemetry &amp; MATLAB® Numerical Analysis</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>Engine: GNU Octave / MATLAB 9.2</span>
            <span>&bull;</span>
            <span style={{ color: 'var(--accent-emerald)' }}>3-Sigma Fault Prediction</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
