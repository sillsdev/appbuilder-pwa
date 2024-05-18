export interface TaskOutput {
    taskName: string;
    files: {
        path: string;
        content: string;
    }[];
}

export type Promisable<T> = T | Promise<T>;

export abstract class Task {
    public triggerFiles!: string[];

    constructor(protected dataDir: string) {}

    public abstract run(
        verbose: number,
        outputs: Map<string, TaskOutput | null>,
        modifiedPaths: string[]
    ): Promisable<TaskOutput>;
}
