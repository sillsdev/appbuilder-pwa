import { ConvertConfig } from './convertConfig';
import { ConvertContents } from './convertContents';
import { ConvertManifest } from './convertManifest';
import { ConvertMedia } from './convertMedia';
import { ConvertBooks } from './convertBooks';
import { ConvertAbout } from './convertAbout';
import { ConvertFirebase } from './convertFirebase';
import { ConvertStyles } from './convertStyles';
import { ConvertBadges } from './convertBadges';
import { ConvertPlans } from './convertPlans';
import { watch } from 'chokidar';
import { Task, TaskOutput } from './Task';
import { writeFile } from 'fs';
import path from 'path';

// Possible arguments:
// --data-dir=<path> (override data path)
// --examples (convert examples; incompatible with --data-dir)
// --watch (watch for changes)
// --watch-timeout=<ms> (time between changes)
// --verbose (log more messages to console)

const suppliedDataDir = process.argv.find((arg) => arg.includes('--data-dir'));
const dataDir = suppliedDataDir
    ? suppliedDataDir.split('=')[1]
    : process.argv.includes('--examples')
      ? 'example_data'
      : 'data';

const watchTimeoutArg = process.argv.find((arg) => arg.includes('--watch-timeout'));
const watchTimeout = watchTimeoutArg ? parseInt(watchTimeoutArg.split('=')[1]) : 100;

const verboseLevel = process.argv.find((arg) => arg.includes('--verbose'));
const verbose: number = verboseLevel
    ? verboseLevel.includes('=')
        ? parseInt(verboseLevel.split('=')[1])
        : 1
    : 0;

const stepClasses: Task[] = [
    ConvertConfig,
    ConvertContents,
    ConvertPlans,
    ConvertStyles,
    ConvertManifest,
    ConvertMedia,
    ConvertBooks,
    ConvertFirebase,
    ConvertBadges,
    ConvertAbout
].map((x) => new x(dataDir));
const allPaths = new Set(
    stepClasses.reduce((acc, step) => acc.concat(step.triggerFiles), [] as string[])
);

const outputs: Map<string, TaskOutput | null> = new Map(
    stepClasses.map((x) => [x.constructor.name, null])
);

let currentStep = 0;
let lastStepOutput = '';

const stepLogger = (...args: any[]) => (lastStepOutput += args.join(' ') + '\n');
async function fullConvert(printDetails: boolean): Promise<boolean> {
    currentStep = 0;
    const oldConsoleError = console.error;
    const oldConsoleLog = console.log;
    if (!printDetails) {
        console.error = stepLogger;
        console.log = stepLogger;
    }
    for (const step of stepClasses) {
        lastStepOutput = '';
        oldConsoleLog(step.constructor.name + ` (${currentStep + 1}/${stepClasses.length})`);
        try {
            // step may be async, in which case it should be awaited
            const out = await step.run(verbose, outputs, step.triggerFiles);
            outputs.set(step.constructor.name, out);
            await Promise.all(
                out.files.map(
                    (f) =>
                        new Promise((r) => {
                            writeFile(f.path, f.content, r);
                        })
                )
            );
        } catch (e) {
            oldConsoleLog(lastStepOutput);
            oldConsoleLog(e);
            console.error = oldConsoleError;
            console.log = oldConsoleLog;
            return false;
        }
        // if (printDetails) oldConsoleLog(lastStepOutput);
        currentStep++;
    }
    console.error = oldConsoleError;
    console.log = oldConsoleLog;
    return true;
}

if (process.argv.includes('--watch')) {
    (async () => {
        console.log('Compiling...');
        await fullConvert(false);
        console.log('Watching for changes...');
        let timer: NodeJS.Timeout;
        let paths: string[] = [];
        let firstRun = true;
        watch(dataDir).on('all', async (event, watchPath) => {
            watchPath = watchPath.substring(dataDir.length + 1);
            if (
                !firstRun &&
                Array.from(allPaths.values()).some(
                    (p) => watchPath.startsWith(p + path.sep) || watchPath === p
                )
            )
                console.log(`${watchPath} changed`);
            paths.push(watchPath);
            if (timer) clearTimeout(timer);
            timer = setTimeout(async () => {
                if (firstRun) {
                    firstRun = false;
                    paths = [];
                    return;
                }
                const oldConsoleError = console.error;
                const oldConsoleLog = console.log;
                console.error = stepLogger;
                console.log = stepLogger;

                for (const step of stepClasses) {
                    for (const triggerFile of step.triggerFiles) {
                        // Trigger if the path is a trigger file OR
                        // if the trigger file is a directory (ends with /) and the path is in that directory
                        if (
                            paths.includes(triggerFile) ||
                            paths.find((p) => p.startsWith(triggerFile + path.sep))
                        ) {
                            try {
                                oldConsoleLog('Running step ' + step.constructor.name);
                                const out = await step.run(verbose, outputs, paths);
                                outputs.set(step.constructor.name, out);
                                // Write all files to disk
                                /*await*/ // We don't need to await the file writes; next steps can continue running while writes occur
                                Promise.all(
                                    out.files.map((f) => {
                                        new Promise((r) => writeFile(f.path, f.content, r));
                                    })
                                );
                            } catch (e) {
                                oldConsoleLog(lastStepOutput);
                                oldConsoleLog(e);
                                console.error = oldConsoleError;
                                console.log = oldConsoleLog;
                                return false;
                            }
                            break;
                        }
                    }
                }
                console.error = oldConsoleError;
                console.log = oldConsoleLog;

                console.log('Conversion successful');
                console.log('Watching for changes...');
                paths = [];
            }, watchTimeout);
        });
    })();
} else {
    fullConvert(true).then((success) => process.exit(success ? 0 : 1));
}
