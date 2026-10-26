function forecast = forecastResourceUsage(values, timestamps, targetThreshold, horizonPoints)
% FORECASTRESOURCEUSAGE Performs trend estimation and capacity exhaustion forecasting
% on infrastructure metrics using Ordinary Least Squares (OLS) Linear Regression.
%
% Syntax:
%   forecast = forecastResourceUsage(values, timestamps, targetThreshold, horizonPoints)
%
% Inputs:
%   values          - Vector of metric observations (e.g., disk utilization %).
%   timestamps      - (Optional) Vector of epoch timestamps in seconds (or 1:N if empty).
%   targetThreshold - (Optional) Critical exhaustion percentage (e.g., 90.0 or 95.0). Default: 90.0.
%   horizonPoints   - (Optional) Number of future points to project. Default: 30.
%
% Outputs:
%   forecast - Struct containing:
%       .isPredictable            - Boolean (true if a meaningful growth trend exists)
%       .reason                   - Explanation if not predictable
%       .slope                    - Rate of change per second (or per sample)
%       .slopePerDay              - Rate of change extrapolated to 24 hours
%       .intercept                - OLS y-intercept
%       .rSquared                 - Coefficient of determination R^2
%       .mae                      - In-sample Mean Absolute Error
%       .rmse                     - In-sample Root Mean Squared Error
%       .currentValue             - Latest observed value
%       .targetThreshold          - The threshold evaluated
%       .timeToExhaustionSeconds  - Seconds until threshold is breached (NaN if non-growing)
%       .timeToExhaustionHours    - Hours until threshold is breached (NaN if non-growing)
%       .projectedTimestamps      - Future projected time vector
%       .projectedValues          - Future projected values vector
%
% Mathematical Formulations:
%   1. Linear Model:
%      y_t = \beta_0 + \beta_1 \cdot t + \varepsilon_t
%
%   2. OLS Analytical Solution:
%      \bar{t} = \frac{1}{N} \sum t_i, \quad \bar{y} = \frac{1}{N} \sum y_i
%      \beta_1 = \frac{\sum (t_i - \bar{t})(y_i - \bar{y})}{\sum (t_i - \bar{t})^2}
%      \beta_0 = \bar{y} - \beta_1 \bar{t}
%
%   3. Coefficient of Determination (R^2):
%      SS_{tot} = \sum (y_i - \bar{y})^2, \quad SS_{res} = \sum (y_i - \hat{y}_i)^2
%      R^2 = 1 - \frac{SS_{res}}{SS_{tot}}
%
%   4. Time-To-Exhaustion (TTE):
%      t_{target} = \frac{\text{targetThreshold} - \beta_0}{\beta_1}
%      \Delta t_{exhaustion} = t_{target} - t_{now} \quad (\text{valid only when } \beta_1 > 0 \text{ and } y_{now} < \text{targetThreshold})
%
% Assumptions & Limitations:
%   - Assumes approximately linear consumption over the analysis window.
%   - Sudden unpredictable workloads or disk cleanups violate the linear assumption.
%   - Minimum of 10 samples required for meaningful estimation.
%   - If slope <= 0, exhaustion is not projected to occur based on current trend.
%
% Author: SentinelMAT Engineering Team

    if nargin < 1 || isempty(values)
        error('forecastResourceUsage:EmptyInput', 'Values vector must not be empty.');
    end
    if nargin < 2 || isempty(timestamps)
        timestamps = (1:length(values))';
    end
    if nargin < 3 || isempty(targetThreshold)
        targetThreshold = 90.0;
    end
    if nargin < 4 || isempty(horizonPoints)
        horizonPoints = 30;
    end

    y = values(:);
    t = timestamps(:);

    % Filter finite values
    validMask = isfinite(y) & isfinite(t);
    y = y(validMask);
    t = t(validMask);
    N = length(y);

    % Initialize default struct
    forecast.isPredictable = false;
    forecast.reason = '';
    forecast.slope = 0.0;
    forecast.slopePerDay = 0.0;
    forecast.intercept = 0.0;
    forecast.rSquared = 0.0;
    forecast.mae = 0.0;
    forecast.rmse = 0.0;
    forecast.currentValue = 0.0;
    forecast.targetThreshold = double(targetThreshold);
    forecast.timeToExhaustionSeconds = NaN;
    forecast.timeToExhaustionHours = NaN;
    forecast.projectedTimestamps = [];
    forecast.projectedValues = [];

    if N < 10
        forecast.reason = sprintf('Insufficient sample size (%d). Minimum 10 observations required for regression.', N);
        return;
    end

    forecast.currentValue = double(y(end));

    % OLS Linear Regression Computation
    mean_t = sum(t) / N;
    mean_y = sum(y) / N;

    dt = t - mean_t;
    dy = y - mean_y;

    sum_dt2 = sum(dt.^2);
    sum_dtdy = sum(dt .* dy);

    if sum_dt2 < 1e-12
        forecast.reason = 'Zero time variance: timestamps are identical or degenerate.';
        return;
    end

    beta1 = sum_dtdy / sum_dt2;
    beta0 = mean_y - beta1 * mean_t;

    % In-sample fitted values and goodness of fit
    y_hat = beta0 + beta1 * t;
    residuals = y - y_hat;

    ss_tot = sum(dy.^2);
    ss_res = sum(residuals.^2);

    if ss_tot > 1e-12
        r2 = max(0.0, 1.0 - (ss_res / ss_tot));
    else
        r2 = 1.0; % Constant series
    end

    mae = sum(abs(residuals)) / N;
    rmse = sqrt(sum(residuals.^2) / N);

    forecast.slope = double(beta1);
    forecast.intercept = double(beta0);
    forecast.rSquared = double(r2);
    forecast.mae = double(mae);
    forecast.rmse = double(rmse);

    % Extrapolate slope to 24 hours (86,400 seconds)
    % If timestamps are unit index (step=1), assume 5-second sampling
    dt_avg = (t(end) - t(1)) / max(1, N - 1);
    if dt_avg > 0
        forecast.slopePerDay = double(beta1 * 86400);
    else
        forecast.slopePerDay = double(beta1 * (86400 / 5));
    end

    % Evaluate Exhaustion Condition
    t_now = t(end);
    current_val = y(end);

    if current_val >= targetThreshold
        forecast.isPredictable = true;
        forecast.timeToExhaustionSeconds = 0.0;
        forecast.timeToExhaustionHours = 0.0;
        forecast.reason = sprintf('Target threshold (%.1f%%) is already reached or exceeded (Current: %.1f%%).', targetThreshold, current_val);
    elseif beta1 <= 1e-9
        forecast.isPredictable = false;
        if beta1 < -1e-9
            forecast.reason = sprintf('Negative consumption slope (%.4f units/sec); resource usage is declining. No exhaustion projected.', beta1);
        else
            forecast.reason = 'Resource consumption rate is flat; no growth trend detected.';
        end
    else
        % Positive growth trend -> Calculate Time to Exhaustion (TTE)
        t_target = (targetThreshold - beta0) / beta1;
        tte_sec = max(0.0, t_target - t_now);
        tte_hrs = tte_sec / 3600.0;

        forecast.isPredictable = true;
        forecast.timeToExhaustionSeconds = double(tte_sec);
        forecast.timeToExhaustionHours = double(tte_hrs);
        forecast.reason = sprintf('Positive trend detected (+%.2f%%/day, R^2=%.3f). Projected to breach %.1f%% in %.1f hours.', ...
            forecast.slopePerDay, r2, targetThreshold, tte_hrs);
    end

    % Generate projection points
    if dt_avg <= 0
        dt_avg = 5.0;
    end
    future_t = (t_now + (1:horizonPoints)' * dt_avg);
    future_y = beta0 + beta1 * future_t;
    % Clamp projected values between [0, 100] for percentage metrics
    future_y = max(0.0, min(100.0, future_y));

    forecast.projectedTimestamps = double(future_t);
    forecast.projectedValues = double(future_y);
end
