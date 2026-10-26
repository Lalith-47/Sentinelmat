function stats = calculateStatistics(values, timestamps)
% CALCULATESTATISTICS Computes comprehensive descriptive and moving statistics
% for a numerical infrastructure time-series metric.
%
% Syntax:
%   stats = calculateStatistics(values, timestamps)
%
% Inputs:
%   values     - Array of numerical metric observations (e.g. CPU or Disk %)
%   timestamps - (Optional) Array of UNIX epoch timestamps (seconds or ms)
%
% Outputs:
%   stats - Struct containing:
%       .count         - Number of valid observations (N)
%       .mean          - Arithmetic mean (mu)
%       .median        - Sample median (50th percentile)
%       .std           - Sample standard deviation (sigma)
%       .variance      - Sample variance (sigma^2)
%       .min           - Minimum observed value
%       .max           - Maximum observed value
%       .range         - Difference between max and min
%       .iqr           - Interquartile range (p75 - p25)
%       .p25           - 25th percentile (Q1)
%       .p50           - 50th percentile (Q2)
%       .p75           - 75th percentile (Q3)
%       .p90           - 90th percentile
%       .p95           - 95th percentile
%       .p99           - 99th percentile
%       .moving_avg_5  - 5-sample trailing simple moving average (last value)
%       .moving_avg_15 - 15-sample trailing simple moving average (last value)
%
% Mathematical Formulations:
%   1. Arithmetic Mean:
%      \mu = \frac{1}{N} \sum_{i=1}^{N} x_i
%
%   2. Sample Variance (Bessel-corrected unbiasing factor N-1):
%      s^2 = \frac{1}{N-1} \sum_{i=1}^{N} (x_i - \mu)^2
%
%   3. Percentiles using NIST Type 6 / standard linear interpolation:
%      Sorted ranks: p = \frac{k}{100}(N - 1) + 1
%
% Assumptions & Limitations:
%   - Observations are real-valued scalar quantities.
%   - Non-finite numbers (NaN, Inf) are filtered out before computation.
%   - Minimum of 1 observation required; variance requires N >= 2.
%
% Author: SentinelMAT Engineering Team

    if nargin < 1 || isempty(values)
        error('calculateStatistics:EmptyInput', 'Input vector "values" must not be empty.');
    end

    % Coerce to column vector and filter invalid entries (NaN, Inf)
    v = values(:);
    validMask = isfinite(v);
    v = v(validMask);
    N = length(v);

    if N == 0
        error('calculateStatistics:NoFiniteData', 'Input vector contains no finite numerical data.');
    end

    % 1. Primary Central Tendency & Dispersion
    mu = sum(v) / N;

    if N > 1
        var_s = sum((v - mu).^2) / (N - 1);
        sig_s = sqrt(var_s);
    else
        var_s = 0.0;
        sig_s = 0.0;
    end

    sorted_v = sort(v);
    min_val = sorted_v(1);
    max_val = sorted_v(end);

    % 2. Percentile Calculations via Linear Interpolation (Independent of Statistics Toolbox)
    p25 = computePercentile(sorted_v, N, 25);
    p50 = computePercentile(sorted_v, N, 50);
    p75 = computePercentile(sorted_v, N, 75);
    p90 = computePercentile(sorted_v, N, 90);
    p95 = computePercentile(sorted_v, N, 95);
    p99 = computePercentile(sorted_v, N, 99);
    iqr_val = p75 - p25;

    % 3. Trailing Moving Averages
    if N >= 5
        ma5 = sum(v(end-4:end)) / 5;
    else
        ma5 = mu;
    end

    if N >= 15
        ma15 = sum(v(end-14:end)) / 15;
    else
        ma15 = mu;
    end

    % Construct result struct
    stats.count = N;
    stats.mean = double(mu);
    stats.median = double(p50);
    stats.std = double(sig_s);
    stats.variance = double(var_s);
    stats.min = double(min_val);
    stats.max = double(max_val);
    stats.range = double(max_val - min_val);
    stats.iqr = double(iqr_val);
    stats.p25 = double(p25);
    stats.p50 = double(p50);
    stats.p75 = double(p75);
    stats.p90 = double(p90);
    stats.p95 = double(p95);
    stats.p99 = double(p99);
    stats.moving_avg_5 = double(ma5);
    stats.moving_avg_15 = double(ma15);
end

function p = computePercentile(sorted_v, N, prc)
    % Compute percentile using standard empirical CDF linear interpolation
    if N == 1
        p = sorted_v(1);
        return;
    end
    rank = (prc / 100) * (N - 1) + 1;
    lowIdx = floor(rank);
    highIdx = ceil(rank);
    weight = rank - lowIdx;
    
    lowIdx = max(1, min(N, lowIdx));
    highIdx = max(1, min(N, highIdx));
    
    p = (1 - weight) * sorted_v(lowIdx) + weight * sorted_v(highIdx);
end
