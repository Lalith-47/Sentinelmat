function runAnalysisPipeline(inputFile, outputFile)
% RUNANALYSISPIPELINE Standalone CLI entrypoint for SentinelMAT analysis.
% Can be executed from MATLAB or Octave command line or batch mode:
%   octave --no-gui --quiet runAnalysisPipeline.m input.json output.json
%   matlab -batch "runAnalysisPipeline('input.json', 'output.json')"

    % Ensure current directory and helper scripts are on MATLAB/Octave path
    scriptDir = fileparts(mfilename('fullpath'));
    if ~isempty(scriptDir)
        addpath(scriptDir);
    end

    % Determine input and output file paths from function args or CLI argv
    if nargin < 2
        cliArgs = {};
        if exist('argv', 'builtin') || exist('argv', 'file')
            cliArgs = argv();
        end
        if length(cliArgs) >= 2
            inputFile = cliArgs{1};
            outputFile = cliArgs{2};
        else
            error('runAnalysisPipeline:MissingArguments', ...
                'Usage: runAnalysisPipeline(inputFile, outputFile) or octave runAnalysisPipeline.m <input.json> <output.json>');
        end
    end

    fprintf('[SentinelMAT Engine] Loading input dataset from: %s\n', inputFile);
    if ~exist(inputFile, 'file')
        error('runAnalysisPipeline:FileNotFound', 'Input file "%s" does not exist.', inputFile);
    end

    rawJson = fileread(inputFile);
    inputData = jsondecode(rawJson);

    fprintf('[SentinelMAT Engine] Executing numerical analysis pipeline...\n');
    t_start = clock();
    results = analyzeMetrics(inputData);
    elapsedSec = etime(clock(), t_start);

    results.pipelineExecutionTimeSec = elapsedSec;
    fprintf('[SentinelMAT Engine] Analysis completed in %.3f seconds.\n', elapsedSec);

    % Encode result to JSON
    jsonStr = jsonencode(results);

    % Write output
    fid = fopen(outputFile, 'w');
    if fid == -1
        error('runAnalysisPipeline:CannotWriteFile', 'Unable to open "%s" for writing.', outputFile);
    end
    fwrite(fid, jsonStr, 'char');
    fclose(fid);

    fprintf('[SentinelMAT Engine] Results successfully exported to: %s\n', outputFile);
end

% Top-level script execution check for Octave CLI invocation
if ~exist('inputFile', 'var') && (exist('argv', 'builtin') || exist('argv', 'file'))
    args = argv();
    if length(args) >= 2
        runAnalysisPipeline(args{1}, args{2});
    end
end
