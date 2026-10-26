function test_evaluatePredictions()
    fprintf('Running test_evaluatePredictions...\n');
    addpath(fullfile(fileparts(mfilename('fullpath')), '..'));

    % Generate 30 points of linear trend with small noise
    t = (1:30)';
    y = 20.0 + 0.5 * t;

    eval = evaluatePredictions(y, t, 0.8);
    assert(strcmp(eval.status, 'valid'), 'Status should be valid');
    assert(eval.trainCount == 24, 'Train count should be 24');
    assert(eval.testCount == 6, 'Test count should be 6');
    assert(eval.outOfSampleMAE < 1e-3, 'Out of sample MAE for linear data should be near 0');
    assert(eval.inSampleR2 > 0.99, 'In-sample R2 should be near 1.0');

    fprintf('PASS: test_evaluatePredictions\n');
end
