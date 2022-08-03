import { TaskOutput, Task, Promisable } from './Task';

export interface AboutTaskOutput extends TaskOutput {
    taskName: 'ConvertAbout';
}
/**
 * Currently does nothing.
 * Will at some point convert about.txt into something About.svelte can use.
 */
export class ConvertAbout extends Task {
    public triggerFiles: string[] = ['about'];
    constructor(dataDir: string) {
        super(dataDir);
    }
    public run(verbose: boolean, outputs: Map<string, TaskOutput>): Promisable<AboutTaskOutput> {
        // TODO: Once about pages are exported, convert them here
        // Currently does nothing
        return {
            taskName: 'ConvertAbout',
            files: []
        };
    }
}
