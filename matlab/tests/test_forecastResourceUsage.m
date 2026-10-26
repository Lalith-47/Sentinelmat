function test_forecastResourceUsage()
    fprintf('Running test_forecastResourceUsage...\n');
    addpath(fullfile(fileparts(mfilename('fullpath')), '..'));

    % Scenario 1: Steady linear disk growth from 50% to 70% over 20 points
    t = (1:20)' * 60; % 60-second intervals
    disk_usage = 50.0 + (1:20)' * 1.0; % grows by 1% each step -> reaches 70% at t=1200s

    fc = forecastResourceUsage(disk_usage, t, 90.0, 30);
    assert(fc.isPredictable == true, 'Linear growth should be predictable');
    assert(fc.slope > 0, 'Slope should be positive');
    assert(abs(fc.rSquared - 1.0) < 1e-4, 'R^2 should be near 1.0 for perfect line');
    assert(~isnan(fc.timeToExhaustionHours), 'TTE hours should not be NaN');
    assert(length(fc.projectedValues) == 30, 'Projected values length should match horizonPoints');

    % Scenario 2: Declining trend
    declining = 80.0 - (1:20)' * 0.5;
    fc_dec = forecastResourceUsage(declining, t, 90.0);
    assert(fc_dec.isPredictable == false, 'Declining trend should not predict exhaustion');
    assert(isnan(fc_dec.timeToExhaustionHours), 'Declining trend TTE should be NaN');

    fprintf('PASS: test_forecastResourceUsage\n');
end
