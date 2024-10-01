import { TaskOutput, Task } from './Task';

export function convertReverseIndex(dataDir: string, verbose: number) {
    
}
export class ConvertReverseIndex extends Task {
    public triggerFiles: string[] = ["lexicon-en.idx"];

    constructor(dataDir: string) {
        super(dataDir);
    }
    public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        convertReverseIndex(this.dataDir, verbose);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}
