import { ConfigTaskOutput } from './convertConfig';
import { TaskOutput, Task, Promisable } from './Task';

export interface BooksTaskOutput extends TaskOutput {
    taskName: 'ConvertBooks';
}
export class ConvertBooks extends Task {
    public triggerFiles: string[] = ['books'];
    constructor(dataDir: string) {
        super(dataDir);
    }
    public run(outputs: Map<string, TaskOutput>): Promisable<BooksTaskOutput> {
        // TODO: Once books are exported, convert them here
        // Currently does nothing
        const config = (outputs.get('ConvertConfig') as ConfigTaskOutput).data;

        // For printing to the console; the audio makes the output enourmous
        config.bookCollections.forEach((bookCollection: any) => {
            bookCollection.books.forEach((book: any) => {
                book.audio = '...';
            });
        });
        console.log(JSON.stringify(config.bookCollections));
        return {
            taskName: 'ConvertBooks',
            files: []
        };
    }
}
