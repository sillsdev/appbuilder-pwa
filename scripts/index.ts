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

const oldConsoleLog = console.log;
const oldConsoleError = console.error;
let currentStep = 0;
let currentWatchOutput = '';
let currentOutput = '';
let currentErrors = '';

function print() {
    console.clear();
    oldConsoleLog(currentWatchOutput);
    oldConsoleLog(currentOutput);
    oldConsoleError(currentErrors);
    oldConsoleLog(`${steps[currentStep].name} (${currentStep + 1}/${steps.length})...`);
}

console.log = (...args) => {
    currentOutput += args.join(' ') + '\n';
    print();
};

console.error = (...args) => {
    currentErrors += args.join(' ') + '\n';
    print();
};

async function convert() {
    currentErrors = '';
    currentStep = 0;
    for (const step of steps) {
        currentOutput = '';
        try {
            // step may be async, in which case it should be awaited
            await step(dataDir);
        } catch (e) {
            console.log(e);
            return;
        }
        currentStep++;
    }
}

// TODO: watch mode/examples
if (process.argv.includes('--watch')) {
    currentWatchOutput += 'Watching for changes...\n';
    // watch for changes with chokidar
    let timer: NodeJS.Timeout;

    watch(dataDir).on('all', async (event, path) => {
        currentWatchOutput += `${path} changed\n`;
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
            await convert();
            currentWatchOutput = 'Watching for changes...\n';
        }, watchTimeout);
        print();
    });
}
convert();
