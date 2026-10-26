function evaluation = evaluatePredictions(values, timestamps, trainRatio)
% EVALUATEPREDICTIONS Evaluates forecasting model performance by splitting historical
% observations into training and holdout test sets, computing out-of-sample metrics.
%
% Syntax:
%   evaluation = evaluatePredictions(values, timestamps, trainRatio)
%
% Inputs:
%   values     - Array of historical observations.
%   timestamps - (Optional) Array of epoch timestamps.
%   trainRatio - (Optional) Fraction of data to reserve for training (default: 0.80).
%
% Outputs:
%   evaluation - Struct containing:
%       .trainCount            - Number of training observations
%       .testCount             - Number of holdout test observations
%       .trainRatio            - Ratio used
%       .outOfSampleMAE        - Out-of-sample Mean Absolute Error
%       .outOfSampleRMSE       - Out-of-sample Root Mean Squared Error
%       .outOfSampleMAPE       - Out-of-sample Mean Absolute Percentage Error (%)
%       .inSampleR2            - Training set R^2
%       .actualTestValues      - Ground truth values from holdout set
%       .predictedValues       - Model forecast values for holdout set
%       .residuals             - Test errors (actual - predicted)
%       .directionalAccuracy   - % agreement in trend direction
%       .status                - 'valid' or explanation if insufficient data
%
% Mathematical Formulations:
%   1. MAE = \frac{1}{M} \sum_{i=1}^M |y_i - \hat{y}_i|
%   2. RMSE = \sqrt{ \frac{1}{M} \sum_{i=1}^M (y_i - \hat{y}_i)^2 }
%   3. MAPE = \frac{100\%}{M} \sum_{i=1}^M \left|\frac{y_i - \hat{y}_i}{y_i + \epsilon}\right|
%
% Author: SentinelMAT Engineering Team

    if nargin < 1 || isempty(values)
        error('evaluatePredictions:EmptyInput', 'Values array must not be empty.');
    end
    if nargin < 2 || isempty(timestamps)
        timestamps = (1:length(values))';
    end
    if nargin < 3 || isempty(trainRatio)
        trainRatio = 0.80;
    end

    y = values(:);
    t = timestamps(:);

    valid = isfinite(y) & isfinite(t);
    y = y(valid);
    t = t(valid);
    N = length(y);

    evaluation.trainCount = 0;
    evaluation.testCount = 0;
    evaluation.trainRatio = trainRatio;
    evaluation.outOfSampleMAE = NaN;
    evaluation.outOfSampleRMSE = NaN;
    evaluation.outOfSampleMAPE = NaN;
    evaluation.inSampleR2 = NaN;
    evaluation.actualTestValues = [];
    evaluation.predictedValues = [];
    evaluation.residuals = [];
    evaluation.directionalAccuracy = NaN;
    evaluation.status = '';

    if N < 15
        evaluation.status = sprintf('Insufficient data points (%d). Minimum 15 required for train/test split.', N);
        return;
    end

    trainCount = floor(N * trainRatio);
    testCount = N - trainCount;

    if trainCount < 8 || testCount < 4
        evaluation.status = 'Split resulted in too few training (<8) or testing (<4) observations.';
        return;
    end

    % Train partition
    t_train = t(1:trainCount);
    y_train = y(1:trainCount);

    % Test partition
    t_test = t((trainCount + 1):end);
    y_test = y((trainCount + 1):end);

    % Fit OLS on training partition
    mean_t_tr = sum(t_train) / trainCount;
    mean_y_tr = sum(y_train) / trainCount;
    dt_tr = t_train - mean_t_tr;
    dy_tr = y_train - mean_y_tr;

    denom = sum(dt_tr.^2);
    if denom < 1e-12
        evaluation.status = 'Degenerate training timestamps (zero variance).';
        return;
    end

    beta1 = sum(dt_tr .* dy_tr) / denom;
    beta0 = mean_y_tr - beta1 * mean_t_tr;

    % In-sample R^2
    y_hat_tr = beta0 + beta1 * t_train;
    ss_tot_tr = sum(dy_tr.^2);
    ss_res_tr = sum((y_train - y_hat_tr).^2);
    if ss_tot_tr > 1e-12
        r2_in = max(0.0, 1.0 - (ss_res_tr / ss_tot_tr));
    else
        r2_in = 1.0;
    end

    % Out-of-sample predictions
    y_pred = beta0 + beta1 * t_test;
    residuals = y_test - y_pred;

    mae = sum(abs(residuals)) / testCount;
    rmse = sqrt(sum(residuals.^2) / testCount);

    % MAPE with epsilon to avoid division by zero
    eps_val = 1e-5;
    mape = (100.0 / testCount) * sum(abs(residuals) ./ max(abs(y_test), eps_val));

    % Directional accuracy: sign of (y_{t} - y_{t-1}) vs (pred_{t} - y_{t-1})
    prev_y = [y_train(end); y_test(1:end-1)];
    actual_dir = sign(y_test - prev_y);
    pred_dir = sign(y_pred - prev_y);
    dir_match = (actual_dir == pred_dir);
    dir_acc = (sum(dir_match) / testCount) * 100.0;

    evaluation.trainCount = trainCount;
    evaluation.testCount = testCount;
    evaluation.outOfSampleMAE = double(mae);
    evaluation.outOfSampleRMSE = double(rmse);
    evaluation.outOfSampleMAPE = double(mape);
    evaluation.inSampleR2 = double(r2_in);
    evaluation.actualTestValues = double(y_test);
    evaluation.predictedValues = double(y_pred);
    evaluation.residuals = double(residuals);
    evaluation.directionalAccuracy = double(dir_acc);
    evaluation.status = 'valid';
end
