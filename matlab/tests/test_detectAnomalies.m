function test_detectAnomalies()
    fprintf('Running test_detectAnomalies...\n');
    addpath(fullfile(fileparts(mfilename('fullpath')), '..'));

    % Generate synthetic baseline with small variance around 20.0
    rng_seed = 42;
    N = 40;
    % deterministic pseudo-random baseline
    t = (1:N)';
    baseline = 20.0 + sin(t * 0.2) * 1.5;

    % Inject clear anomaly at index 35
    baseline(35) = 85.0;

    rep = detectAnomalies(baseline, t, 'cpu');
    assert(rep.totalSamples == N, 'Total samples should match N');
    assert(rep.anomalyCount >= 1, 'Should detect at least 1 anomaly');

    found = false;
    for i = 1:length(rep.anomalies)
        if rep.anomalies(i).index == 35
            found = true;
            assert(rep.anomalies(i).observedValue == 85.0, 'Observed value should be 85');
            assert(rep.anomalies(i).zScore > 3.0, 'Z-score of massive spike should exceed 3.0');
            assert(strcmp(rep.anomalies(i).severity, 'critical'), 'Spike should be flagged critical');
        end
    end
    assert(found, 'Anomaly at index 35 must be detected');

    % Test with flat signal (zero variance)
    flat = ones(30, 1) * 15.0;
    flatRep = detectAnomalies(flat, (1:30)', 'cpu');
    assert(flatRep.anomalyCount == 0, 'Flat signal should have 0 anomalies');

    fprintf('PASS: test_detectAnomalies\n');
end
