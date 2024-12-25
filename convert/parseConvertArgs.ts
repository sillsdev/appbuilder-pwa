import { ConversionParams } from 'convertAll';

function parseDataDir(cliArgs: string[]): string {
    const suppliedDataDir = cliArgs.find((arg) => arg.includes('--data-dir'));
    return suppliedDataDir ? suppliedDataDir.split('=')[1] : 'data';
}

function parseWatchTimeout(cliArgs: string[]): number {
    const watchTimeoutArg = cliArgs.find((arg) => arg.includes('--watch-timeout'));
    return watchTimeoutArg ? parseInt(watchTimeoutArg.split('=')[1]) : 100;
}

function parseVerbosity(cliArgs: string[]): number {
    const verboseLevel = cliArgs.find((arg) => arg.includes('--verbose'));
    return verboseLevel
        ? verboseLevel.includes('=')
            ? parseInt(verboseLevel.split('=')[1])
            : 1
        : 0;
}

export function parseConvertArgs(cliArgs: string[]): ConversionParams {
    const watch = process.argv.includes('--watch');
    return {
        dataDir: parseDataDir(cliArgs),
        watch: cliArgs.includes('--watch'),
        watchTimeout: parseWatchTimeout(cliArgs),
        verbose: parseVerbosity(cliArgs)
    };
}
