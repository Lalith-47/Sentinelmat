import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
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
import { MetricsOverview } from './components/MetricsOverview';
import { TelemetryChart } from './components/TelemetryChart';
import { ForecastChart } from './components/ForecastChart';
import { MatlabStatsTable } from './components/MatlabStatsTable';
import { AnomaliesList } from './components/AnomaliesList';
import { IncidentsView } from './components/IncidentsView';
import { AlertRulesView } from './components/AlertRulesView';
import { SimulationPanel } from './components/SimulationPanel';
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
      const [hist, anomList, incList, ruleList, simList] = await Promise.all([
        api.getHistory(selectedHostId, 100),
        api.getAnomalies(selectedHostId),
        api.getIncidents(),
        api.getAlertRules(),
        api.getSimulationStatus(),
      ]);

      setHistory(hist);
      if (hist.length > 0) {
        setLatestSample(hist[hist.length - 1]);
      }
      setAnomalies(anomList);
      setIncidents(incList);
      setRules(ruleList);
      setSimulations(simList);
    } catch (err) {
      console.warn('[App] Error loading host data:', err);
    }
  }, [selectedHostId]);

  // Initial load
  useEffect(() => {
    loadHosts();
  }, [loadHosts]);

  // Telemetry refresh polling loop (every 4 seconds)
  useEffect(() => {
    loadHostData();
    const interval = setInterval(loadHostData, 4000);
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
      alert(`MATLAB Analysis Failed: ${err.message}`);
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

  // Compute overall host status
  const hostRecord = hosts.find((h) => h.id === selectedHostId);
  const healthState: HostStatus = hostRecord ? hostRecord.status : 'online';

  const diskHistorical = history.map((s) => s.disk_utilization);
  const currentDiskForecast = analysis?.metrics?.disk?.forecast;
  const currentDiskEval = analysis?.metrics?.disk?.evaluation;

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        hosts={hosts}
        selectedHostId={selectedHostId}
        onSelectHost={setSelectedHostId}
        healthState={healthState}
        lastSampleTime={latestSample?.timestamp}
        isAnalyzing={isAnalyzing}
        onTriggerAnalysis={handleTriggerAnalysis}
        matlabEngineInfo={analysis?.engineInfo}
      />

      <main className="main-content">
        {/* Real-time Telemetry Overview Cards */}
        <MetricsOverview sample={latestSample} />

        {/* View Selection Tabs */}
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={16} />
            <span>Telemetry Stream</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'forecast' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecast')}
          >
            <TrendingUp size={16} />
            <span>Capacity Forecast (TTE)</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'matlab' ? 'active' : ''}`}
            onClick={() => setActiveTab('matlab')}
          >
            <Calculator size={16} />
            <span>MATLAB Statistics</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'anomalies' ? 'active' : ''}`}
            onClick={() => setActiveTab('anomalies')}
          >
            <AlertTriangle size={16} />
            <span>Anomalies ({anomalies.length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <ShieldAlert size={16} />
            <span>Incidents ({incidents.filter((i) => i.status !== 'resolved').length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            <Bell size={16} />
            <span>Alert Rules</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'simulation' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulation')}
          >
            <Flame size={16} color="#f59e0b" />
            <span>Fault Simulation</span>
          </button>
        </div>

        {/* Tab Panels */}
        {activeTab === 'overview' && (
          <TelemetryChart samples={history} stats={analysis?.metrics?.cpu?.stats} />
        )}

        {activeTab === 'forecast' && (
          <ForecastChart
            forecast={currentDiskForecast}
            evaluation={currentDiskEval}
            historicalValues={diskHistorical}
            metricTitle="Disk Capacity Exhaustion Model (MATLAB OLS)"
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
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        SentinelMAT &bull; Linux Infrastructure Monitoring &amp; MATLAB Statistical Anomaly Detection &bull; {new Date().getFullYear()}
      </footer>
    </div>
  );
};
