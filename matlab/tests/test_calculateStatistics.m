function test_calculateStatistics()
    fprintf('Running test_calculateStatistics...\n');
    addpath(fullfile(fileparts(mfilename('fullpath')), '..'));

    % Test 1: Standard sequence
    x = [10, 20, 30, 40, 50];
    stats = calculateStatistics(x);
    assert(stats.count == 5, 'Count should be 5');
    assert(abs(stats.mean - 30.0) < 1e-6, 'Mean should be 30');
    assert(abs(stats.median - 30.0) < 1e-6, 'Median should be 30');
    assert(stats.min == 10, 'Min should be 10');
    assert(stats.max == 50, 'Max should be 50');
    assert(stats.range == 40, 'Range should be 40');
    assert(abs(stats.p25 - 20.0) < 1e-6, 'P25 should be 20');
    assert(abs(stats.p75 - 40.0) < 1e-6, 'P75 should be 40');
    assert(abs(stats.iqr - 20.0) < 1e-6, 'IQR should be 20');

    % Test 2: Handling NaN and Inf
    x_dirty = [10, NaN, 20, Inf, 30, -Inf, 40, 50];
    stats_clean = calculateStatistics(x_dirty);
    assert(stats_clean.count == 5, 'Filtered count should be 5');
    assert(abs(stats_clean.mean - 30.0) < 1e-6, 'Mean of clean values should be 30');

    % Test 3: Single element
    stats_single = calculateStatistics([42]);
    assert(stats_single.count == 1, 'Single element count should be 1');
    assert(stats_single.mean == 42, 'Mean should be 42');
    assert(stats_single.std == 0, 'Std of single element should be 0');

    fprintf('PASS: test_calculateStatistics\n');
end
