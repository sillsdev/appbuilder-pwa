import { ConvertAbout } from './convertAbout';
import { ConvertBadges } from './convertBadges';
import { ConvertBooks } from './convertBooks';
import { ConvertConfig } from './convertConfig';
import { ConvertContents } from './convertContents';
import { ConvertFirebase } from './convertFirebase';
import { ConvertManifest } from './convertManifest';
import { ConvertMedia } from './convertMedia';
import { ConvertPlans } from './convertPlans';
import { ConvertReverseIndex } from './convertReverseIndex';
import { ConvertSQLite } from './convertSQLite';
import { ConvertStyles } from './convertStyles';
import { Task, TaskOutDirs, TaskOutput } from './Task';
import { watch } from 'chokidar';
import { writeFile } from 'fs';
import path from 'path';

export interface ConversionParams {
    dataDir: string;
    watch: boolean;
    watchTimeout: number;
    verbose: number;
}

export interface ConversionResult {
    success: boolean;
    killProcess: boolean;
}

//Classes common to both SAB and DAB
const commonStepClasses = [
    ConvertConfig,
    ConvertContents,
    ConvertStyles,
    ConvertManifest,
    ConvertMedia,
    ConvertFirebase,
    ConvertBadges,
    ConvertAbout
];

//Classes only necessary for SAB
const SABStepClasses = [ConvertPlans, ConvertBooks];

const DABStepClasses = [ConvertReverseIndex, ConvertSQLite];

function getProgramType(
    dataDir: string,
    outDirs: TaskOutDirs,
    verbose: number
): string | undefined {
    const convertConfig = new ConvertConfig(dataDir, outDirs);
    const config = convertConfig.run(verbose);
    return config.data.programType;
}

function getStepClasses(dataDir: string, outDirs: TaskOutDirs, verbose: number): Task[] {
    const programType = getProgramType(dataDir, outDirs, verbose);
    return [
        ...commonStepClasses,
        ...(programType == 'SAB' ? SABStepClasses : []),
        ...(programType == 'DAB' ? DABStepClasses : [])
    ].map((x) => new x(dataDir, outDirs));
}

function getAllTriggerPaths(stepClasses: Task[]) {
    return new Set(
        stepClasses.reduce((acc, step) => acc.concat(step.triggerFiles), [] as string[])
    );
}

export class ConvertAll {
    constructor(
        params: ConversionParams,
        private outDirs: TaskOutDirs
    ) {
        this.dataDir = params.dataDir;
        this.watch = params.watch;
        this.watchTimeout = params.watchTimeout;
        this.verbose = params.verbose;
        this.stepClasses = getStepClasses(this.dataDir, this.outDirs, this.verbose);
        this.allPaths = getAllTriggerPaths(this.stepClasses);
        this.outputs = this.initialOutputs();
    }

    dataDir: string;
    watch: boolean;
    watchTimeout: number;
    verbose: number;
    stepClasses: Task[];
    allPaths: Set<string>;
    outputs: Map<string, TaskOutput | null>;

    currentStep = 0;
    lastStepOutput = '';

    initialOutputs(): Map<string, TaskOutput | null> {
        return new Map(this.stepClasses.map((x) => [x.constructor.name, null]));
    }

    stepLogger(...args: any[]) {
        this.lastStepOutput += args.join(' ') + '\n';
    }

    async fullConvert(printDetails: boolean): Promise<boolean> {
        this.currentStep = 0;
        const oldConsoleError = console.error;
        const oldConsoleLog = console.log;
        if (!printDetails) {
            console.error = this.stepLogger;
            console.log = this.stepLogger;
        }
        for (const step of this.stepClasses) {
            this.lastStepOutput = '';
            oldConsoleLog(
                step.constructor.name + ` (${this.currentStep + 1}/${this.stepClasses.length})`
            );
            try {
                // step may be async, in which case it should be awaited
                const out = await step.run(this.verbose, this.outputs, step.triggerFiles);
                this.outputs.set(step.constructor.name, out);
                await Promise.all(
                    out.files.map(
                        (f) =>
                            new Promise((r) => {
                                writeFile(f.path, f.content, r);
                            })
                    )
                );
            } catch (e) {
                oldConsoleLog(this.lastStepOutput);
                oldConsoleLog(e);
                console.error = oldConsoleError;
                console.log = oldConsoleLog;
                return false;
            }
            // if (printDetails) oldConsoleLog(lastStepOutput);
            this.currentStep++;
        }
        console.error = oldConsoleError;
        console.log = oldConsoleLog;
        return true;
    }

    async run(): Promise<ConversionResult> {
        if (this.watch) {
            (async () => {
                console.log('Compiling...');
                await this.fullConvert(false);
                console.log('Watching for changes...');
                let timer: NodeJS.Timeout;
                let paths: string[] = [];
                let firstRun = true;
                watch(this.dataDir).on('all', async (event, watchPath) => {
                    watchPath = watchPath.substring(this.dataDir.length + 1);
                    if (
                        !firstRun &&
                        Array.from(this.allPaths.values()).some(
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
                        console.error = this.stepLogger;
                        console.log = this.stepLogger;

                        for (const step of this.stepClasses) {
                            for (const triggerFile of step.triggerFiles) {
                                // Trigger if the path is a trigger file OR
                                // if the trigger file is a directory (ends with /) and the path is in that directory
                                if (
                                    paths.includes(triggerFile) ||
                                    paths.find((p) => p.startsWith(triggerFile + path.sep))
                                ) {
                                    try {
                                        oldConsoleLog('Running step ' + step.constructor.name);
                                        const out = await step.run(
                                            this.verbose,
                                            this.outputs,
                                            paths
                                        );
                                        this.outputs.set(step.constructor.name, out);
                                        // Write all files to disk
                                        /*await*/ // We don't need to await the file writes; next steps can continue running while writes occur
                                        Promise.all(
                                            out.files.map((f) => {
                                                new Promise((r) => writeFile(f.path, f.content, r));
                                            })
                                        );
                                    } catch (e) {
                                        oldConsoleLog(this.lastStepOutput);
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
                    }, this.watchTimeout);
                });
            })();
            return {
                success: true,
                killProcess: false
            };
        } else {
            const success = await this.fullConvert(true);
            return { success, killProcess: true };
        }
    }
}
