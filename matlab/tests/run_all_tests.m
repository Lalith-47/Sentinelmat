function run_all_tests()
    fprintf('========================================\n');
    fprintf(' SentinelMAT Mathematical Test Suite    \n');
    fprintf('========================================\n');

    testDir = fileparts(mfilename('fullpath'));
    addpath(testDir);
    addpath(fullfile(testDir, '..'));

    failures = 0;

    try
        test_calculateStatistics();
    catch err
        fprintf('FAIL: test_calculateStatistics - %s\n', err.message);
        failures = failures + 1;
    end

    try
        test_detectAnomalies();
    catch err
        fprintf('FAIL: test_detectAnomalies - %s\n', err.message);
        failures = failures + 1;
    end

    try
        test_forecastResourceUsage();
    catch err
        fprintf('FAIL: test_forecastResourceUsage - %s\n', err.message);
        failures = failures + 1;
    end

    try
        test_evaluatePredictions();
    catch err
        fprintf('FAIL: test_evaluatePredictions - %s\n', err.message);
        failures = failures + 1;
    end

    fprintf('========================================\n');
    if failures == 0
        fprintf(' ALL MATLAB TESTS PASSED SUCCESSFULLY! \n');
        fprintf('========================================\n');
    else
        fprintf(' %d TEST(S) FAILED.                    \n', failures);
        fprintf('========================================\n');
        error('run_all_tests:TestFailures', '%d test(s) failed.', failures);
    end
end

% CLI execution trigger
if exist('argv', 'builtin') || exist('argv', 'file')
    run_all_tests();
end
