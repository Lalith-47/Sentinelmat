function anomalyReport = detectAnomalies(values, timestamps, metricName, options)
% DETECTANOMALIES Detects statistical anomalies in infrastructure metric streams
% using an adaptive rolling window baseline and standardized deviation scores (Z-scores).
%
% Syntax:
%   anomalyReport = detectAnomalies(values, timestamps, metricName, options)
%
% Inputs:
%   values      - 1D numeric vector of metric observations.
%   timestamps  - 1D vector of ISO string or numeric epoch timestamps.
%   metricName  - (Optional) Name of the metric (e.g., 'cpu', 'memory', 'disk'). Default: 'metric'.
%   options     - (Optional) Struct with configuration parameters:
%       .windowSize         - Rolling window size in samples (default: 30)
%       .minSamples         - Minimum samples required before evaluation (default: 10)
%       .warningZThreshold  - Z-score threshold for Warning (default: 2.5)
%       .criticalZThreshold - Z-score threshold for Critical (default: 3.5)
%       .minStdThreshold    - Small epsilon floor for standard deviation (default: 1e-4)
%
% Outputs:
%   anomalyReport - Struct containing:
%       .metricName        - Analyzed metric name
%       .totalSamples      - Number of valid input samples
%       .evaluatedSamples  - Number of samples evaluated against rolling baseline
%       .anomalyCount      - Number of anomalies identified
%       .latestZScore      - Standardized score of the most recent observation
%       .isCurrentlyAnomaly- Boolean indicating if the latest sample is anomalous
%       .anomalies         - Array of structs for each detected anomaly:
%           .index          - Sample index
%           .timestamp      - Sample timestamp
%           .observedValue  - Raw observed metric value
%           .baselineMean   - Rolling baseline mean (mu)
%           .baselineStd    - Rolling baseline standard deviation (sigma)
%           .zScore         - Calculated standardized score
%           .threshold      - Threshold exceeded
%           .severity       - 'warning' or 'critical'
%           .explanation    - Human-readable statistical rationale
%
% Mathematical Methodology:
%   Given a rolling window of past observations W_t = {x_{t-w}, ..., x_{t-1}}:
%     1. Baseline Mean:
%        \mu_t = \frac{1}{|W_t|} \sum_{x \in W_t} x
%
%     2. Baseline Standard Deviation:
%        \sigma_t = \sqrt{ \frac{1}{|W_t|-1} \sum_{x \in W_t} (x - \mu_t)^2 }
%
%     3. Standardized Z-Score:
%        Z_t = \frac{x_t - \mu_t}{\max(\sigma_t, \epsilon)}
%
%   If |Z_t| >= criticalZThreshold -> Severity: 'critical'
%   Else if |Z_t| >= warningZThreshold -> Severity: 'warning'
%
% Handling Zero Variance:
%   When a server runs idle, baseline measurements can be identical (e.g. constant 2.1% CPU).
%   The baseline std would be 0. To prevent division by zero, we enforce an epsilon floor
%   and require an absolute deviation threshold before declaring an anomaly.
%
% Author: SentinelMAT Engineering Team

    if nargin < 1 || isempty(values)
        error('detectAnomalies:EmptyInput', 'Input metric values array must not be empty.');
    end
    if nargin < 2 || isempty(timestamps)
        timestamps = 1:length(values);
    end
    if nargin < 3 || isempty(metricName)
        metricName = 'metric';
    end

    % Default configuration options
    opt.windowSize = 30;
    opt.minSamples = 10;
    opt.warningZThreshold = 2.5;
    opt.criticalZThreshold = 3.5;
    opt.minStdThreshold = 1e-4;

    if nargin >= 4 && isstruct(options)
        fields = fieldnames(options);
        for i = 1:length(fields)
            opt.(fields{i}) = options.(fields{i});
        end
    end

    % Coerce to column vectors
    v = values(:);
    N = length(v);

    % Filter non-finite values while keeping index alignment
    validIndices = find(isfinite(v));
    validValues = v(validIndices);
    validTimestamps = timestamps(validIndices);
    numValid = length(validValues);

    anomalyList = struct('index', {}, 'timestamp', {}, 'observedValue', {}, ...
                         'baselineMean', {}, 'baselineStd', {}, 'zScore', {}, ...
                         'threshold', {}, 'severity', {}, 'explanation', {});

    latestZ = 0.0;
    isCurrentAnomaly = false;

    if numValid < opt.minSamples
        % Insufficient data to form statistically significant rolling baseline
        anomalyReport.metricName = metricName;
        anomalyReport.totalSamples = N;
        anomalyReport.evaluatedSamples = 0;
        anomalyReport.anomalyCount = 0;
        anomalyReport.latestZScore = 0.0;
        anomalyReport.isCurrentlyAnomaly = false;
        anomalyReport.anomalies = anomalyList;
        anomalyReport.note = sprintf('Sample count (%d) is below minimum required baseline (%d).', numValid, opt.minSamples);
        return;
    end

    evaluatedCount = 0;

    % Evaluate points starting after minSamples
    for i = (opt.minSamples + 1):numValid
        evaluatedCount = evaluatedCount + 1;
        
        % Define rolling baseline window from preceding observations
        startIdx = max(1, i - opt.windowSize);
        endIdx = i - 1;
        windowData = validValues(startIdx:endIdx);

        baseMean = sum(windowData) / length(windowData);
        baseVar = sum((windowData - baseMean).^2) / max(1, length(windowData) - 1);
        baseStd = sqrt(baseVar);

        currentVal = validValues(i);
        currTimestamp = validTimestamps(i);

        % Zero-variance safeguard:
        % If std is near zero, use epsilon or check absolute deviation
        effectiveStd = max(baseStd, opt.minStdThreshold);
        zScore = (currentVal - baseMean) / effectiveStd;

        if i == numValid
            latestZ = double(zScore);
        end

        absZ = abs(zScore);
        isAnomaly = false;
        sev = 'none';

        if absZ >= opt.criticalZThreshold
            isAnomaly = true;
            sev = 'critical';
            thresh = opt.criticalZThreshold;
        elseif absZ >= opt.warningZThreshold
            isAnomaly = true;
            sev = 'warning';
            thresh = opt.warningZThreshold;
        end

        % Require a minimum practical absolute difference (e.g. 1.0 unit) to avoid alerting on noise in near-constant signals
        if isAnomaly && abs(currentVal - baseMean) < 1.0
            isAnomaly = false;
        end

        if isAnomaly
            if i == numValid
                isCurrentAnomaly = true;
            end

            explanationStr = sprintf('Observed value %.2f deviated by %.2f standard deviations from rolling baseline mean %.2f (sigma = %.2f). Exceeded %s threshold of %.2f.', ...
                currentVal, zScore, baseMean, baseStd, sev, thresh);

            anomEntry.index = validIndices(i);
            anomEntry.timestamp = currTimestamp;
            anomEntry.observedValue = double(currentVal);
            anomEntry.baselineMean = double(baseMean);
            anomEntry.baselineStd = double(baseStd);
            anomEntry.zScore = double(zScore);
            anomEntry.threshold = double(thresh);
            anomEntry.severity = sev;
            anomEntry.explanation = explanationStr;

            anomalyList(end + 1) = anomEntry;
        end
    end

    % Construct final report struct
    anomalyReport.metricName = metricName;
    anomalyReport.totalSamples = N;
    anomalyReport.evaluatedSamples = evaluatedCount;
    anomalyReport.anomalyCount = length(anomalyList);
    anomalyReport.latestZScore = double(latestZ);
    anomalyReport.isCurrentlyAnomaly = isCurrentAnomaly;
    anomalyReport.anomalies = anomalyList;
    anomalyReport.note = sprintf('Evaluated %d observations against rolling baseline (window=%d). Detected %d anomalies.', ...
        evaluatedCount, opt.windowSize, length(anomalyList));
end
