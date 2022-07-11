import { convertConfig } from './convertConfig';
import { convertMedia } from './convertMedia';
import { convertBooks } from './convertBooks';
import { convertAbout } from './convertAbout';
import { watch } from 'chokidar';

// Possible arguments:
// --data-dir=<path> (override data path)
// --examples (convert examples; incompatible with --data-dir)
// --watch (watch for changes)
// --watch-timeout=<ms> (time between changes)

const suppliedDataDir = process.argv.find((arg) => arg.includes('--data-dir'));
const dataDir = suppliedDataDir
    ? suppliedDataDir.split('=')[1]
    : process.argv.includes('--examples')
    ? 'example_data'
    : 'data';

const watchTimeoutArg = process.argv.find((arg) => arg.includes('--watch-timeout'));
const watchTimeout = watchTimeoutArg ? parseInt(watchTimeoutArg.split('=')[1]) : 100;

// Not incremental
const steps = [convertConfig, convertMedia, convertBooks, convertAbout];

let currentStep = 0;
let lastStepOutput = '';

const stepLogger = (...args: any[]) => (lastStepOutput += args.join(' ') + '\n');
async function convert(printDetails: boolean): Promise<boolean> {
    currentStep = 0;
    const oldConsoleError = console.error;
    const oldConsoleLog = console.log;
    console.error = stepLogger;
    console.log = stepLogger;
    for (const step of steps) {
        lastStepOutput = '';
        if (printDetails) oldConsoleLog(step.name + ` (${currentStep + 1}/${steps.length})`);
        try {
            // step may be async, in which case it should be awaited
            await step(dataDir);
        } catch (e) {
            oldConsoleLog(lastStepOutput);
            oldConsoleLog(e + ''); // Just print the short error
            console.error = oldConsoleError;
            console.log = oldConsoleLog;
            return false;
        }
        if (printDetails) oldConsoleLog(lastStepOutput);
        currentStep++;
    }
    console.error = oldConsoleError;
    console.log = oldConsoleLog;
    return true;
}

if (process.argv.includes('--watch')) {
    console.log('Watching for changes...');
    let timer: NodeJS.Timeout;

    watch(dataDir).on('all', async (event, path) => {
        console.log(`${path} changed`);
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
            console.log((await convert(false)) ? 'Conversion successful' : 'Conversion failed');
            console.log('Watching for changes...');
        }, watchTimeout);
    });
} else {
    convert(true).then((success) => process.exit(success ? 0 : 1));
}
