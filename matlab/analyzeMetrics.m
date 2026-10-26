function results = analyzeMetrics(inputData)
% ANALYZEMETRICS Main analytical pipeline orchestrator for SentinelMAT.
% Ingests multi-metric historical time-series datasets, computes descriptive statistics,
% executes rolling-baseline statistical anomaly detection, models capacity exhaustion,
% and evaluates forecasting accuracy across CPU, Memory, Disk, and Network streams.
%
% Syntax:
%   results = analyzeMetrics(inputData)
%
% Input:
%   inputData - Struct containing:
%       .hostId          - Identifier of the monitored host
%       .timestamps      - Vector of epoch timestamps (seconds)
%       .cpu             - Vector of CPU utilization percentages [0-100]
%       .memory          - Vector of Memory utilization percentages [0-100]
%       .disk            - Vector of Disk utilization percentages [0-100]
%       .networkRx       - (Optional) Vector of Network Rx bytes/sec
%       .networkTx       - (Optional) Vector of Network Tx bytes/sec
%       .diskThreshold   - (Optional) Exhaustion limit (default: 90.0)
%
% Output:
%   results - Struct containing:
%       .hostId              - Echo of host identifier
%       .analysisTimestamp   - Time of analysis execution (epoch seconds)
%       .sampleCount         - Number of observations analyzed
%       .engineInfo          - Engine version and runtime metadata
%       .metrics             - Struct for each metric:
%           .cpu              - stats, anomalies, forecast, evaluation
%           .memory           - stats, anomalies, forecast, evaluation
%           .disk             - stats, anomalies, forecast, evaluation
%           .networkRx        - stats, anomalies
%           .networkTx        - stats, anomalies
%       .summary             - High-level system health diagnosis
%
% Author: SentinelMAT Engineering Team

    if nargin < 1 || ~isstruct(inputData)
        error('analyzeMetrics:InvalidInput', 'inputData must be a structured dataset.');
    end

    hostId = 'unknown-host';
    if isfield(inputData, 'hostId') && ~isempty(inputData.hostId)
        hostId = inputData.hostId;
    end

    if ~isfield(inputData, 'timestamps') || isempty(inputData.timestamps)
        error('analyzeMetrics:MissingTimestamps', 'inputData must contain a timestamps vector.');
    end

    timestamps = inputData.timestamps(:);
    N = length(timestamps);

    if N < 2
        error('analyzeMetrics:InsufficientSamples', 'A minimum of 2 historical samples is required for analysis.');
    end

    diskThreshold = 90.0;
    if isfield(inputData, 'diskThreshold') && isnumeric(inputData.diskThreshold)
        diskThreshold = inputData.diskThreshold;
    end

    % Record analysis runtime metadata
    results.hostId = hostId;
    results.analysisTimestamp = floor(posixtime_compat());
    results.sampleCount = N;
    results.engineInfo = sprintf('GNU Octave / MATLAB Numerical Engine - Version %s', version());

    % 1. CPU Analysis
    if isfield(inputData, 'cpu') && ~isempty(inputData.cpu)
        cpuData = inputData.cpu(:);
        results.metrics.cpu.stats = calculateStatistics(cpuData, timestamps);
        results.metrics.cpu.anomalies = detectAnomalies(cpuData, timestamps, 'cpu');
        results.metrics.cpu.forecast = forecastResourceUsage(cpuData, timestamps, 95.0, 20);
        results.metrics.cpu.evaluation = evaluatePredictions(cpuData, timestamps, 0.8);
    end

    % 2. Memory Analysis
    if isfield(inputData, 'memory') && ~isempty(inputData.memory)
        memData = inputData.memory(:);
        results.metrics.memory.stats = calculateStatistics(memData, timestamps);
        results.metrics.memory.anomalies = detectAnomalies(memData, timestamps, 'memory');
        results.metrics.memory.forecast = forecastResourceUsage(memData, timestamps, 95.0, 20);
        results.metrics.memory.evaluation = evaluatePredictions(memData, timestamps, 0.8);
    end

    % 3. Disk Analysis (Primary capacity exhaustion target)
    if isfield(inputData, 'disk') && ~isempty(inputData.disk)
        diskData = inputData.disk(:);
        results.metrics.disk.stats = calculateStatistics(diskData, timestamps);
        results.metrics.disk.anomalies = detectAnomalies(diskData, timestamps, 'disk');
        results.metrics.disk.forecast = forecastResourceUsage(diskData, timestamps, diskThreshold, 50);
        results.metrics.disk.evaluation = evaluatePredictions(diskData, timestamps, 0.8);
    end

    % 4. Network Rx Analysis
    if isfield(inputData, 'networkRx') && ~isempty(inputData.networkRx)
        netRx = inputData.networkRx(:);
        results.metrics.networkRx.stats = calculateStatistics(netRx, timestamps);
        results.metrics.networkRx.anomalies = detectAnomalies(netRx, timestamps, 'network_rx');
    end

    % 5. Network Tx Analysis
    if isfield(inputData, 'networkTx') && ~isempty(inputData.networkTx)
        netTx = inputData.networkTx(:);
        results.metrics.networkTx.stats = calculateStatistics(netTx, timestamps);
        results.metrics.networkTx.anomalies = detectAnomalies(netTx, timestamps, 'network_tx');
    end

    % 6. Synthesize System Health Summary
    totalAnomalies = 0;
    criticalAnomalies = 0;
    metricNames = fieldnames(results.metrics);

    for m = 1:length(metricNames)
        mName = metricNames{m};
        if isfield(results.metrics.(mName), 'anomalies')
            anomList = results.metrics.(mName).anomalies.anomalies;
            totalAnomalies = totalAnomalies + length(anomList);
            for a = 1:length(anomList)
                if strcmp(anomList(a).severity, 'critical')
                    criticalAnomalies = criticalAnomalies + 1;
                end
            end
        end
    end

    diskExhaustionHours = NaN;
    if isfield(results.metrics, 'disk') && isfield(results.metrics.disk, 'forecast')
        if results.metrics.disk.forecast.isPredictable && ~isnan(results.metrics.disk.forecast.timeToExhaustionHours)
            diskExhaustionHours = results.metrics.disk.forecast.timeToExhaustionHours;
        end
    end

    if criticalAnomalies > 0 || (~isnan(diskExhaustionHours) && diskExhaustionHours < 24)
        healthState = 'critical';
    elseif totalAnomalies > 0 || (~isnan(diskExhaustionHours) && diskExhaustionHours < 72)
        healthState = 'warning';
    else
        healthState = 'online';
    end

    results.summary.healthState = healthState;
    results.summary.totalAnomalies = totalAnomalies;
    results.summary.criticalAnomalies = criticalAnomalies;
    results.summary.diskExhaustionHours = double(diskExhaustionHours);
end

function t = posixtime_compat()
    % Compatible epoch timestamp in seconds across MATLAB and Octave
    try
        t = posixtime(datetime('now'));
    catch
        t = time(); % Octave builtin
    end
end
