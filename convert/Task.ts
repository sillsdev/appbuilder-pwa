export type FileContent = {
    path: string;
    content: string;
};

export interface TaskOutDirs {
    static: string;
    config: string;
    firebase: string;
}

export interface TaskOutput {
    taskName: string;
    files: FileContent[];
}

export type Promisable<T> = T | Promise<T>;

export abstract class Task {
    public triggerFiles!: string[];

    constructor(
        protected dataDir: string,
        protected outDirs: TaskOutDirs
    ) {}

    public abstract run(
        verbose: number,
        outputs: Map<string, TaskOutput | null>,
        modifiedPaths: string[]
    ): Promisable<TaskOutput>;
}
