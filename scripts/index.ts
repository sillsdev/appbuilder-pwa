import { convertConfig } from './convertConfig';
import { convertMedia } from './convertMedia';

// Not incremental
const steps = [convertConfig, convertMedia];

const oldConsoleLog = console.log;
const oldConsoleError = console.error;
let currentStep = 0;
let currentOutput = '';
let currentErrors = '';

function print() {
    console.clear();
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

function convert() {
    currentErrors = '';
    currentStep = 0;
    for (const step of steps) {
        currentOutput = '';
        try {
            step();
        } catch (e) {
            console.log('Error: ' + e);
            return;
        }
        currentStep++;
    }
}

// TODO: watch mode/examples
if (process.argv.includes('--watch')) {
    console.log('Watching for changes...');
    setInterval(convert, 1000);
} else {
    convert();
}
