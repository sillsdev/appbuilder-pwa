interface BufferedInput<T> {
    read: (limit: number) => Promise<T[]>;
    done: () => boolean;
}

export class BufferedReader<T> {
    input: BufferedInput<T>;
    buffer: T[] = [];

    constructor(input: BufferedInput<T>) {
        this.input = input;
    }

    async read(limit: number = 0): Promise<T[]> {
        while (!this.input.done() && !this.limitReached(limit)) {
            const batch = await this.input.read(limit);
            this.buffer.push(...batch);
        }

        return this.sliceBuffer(limit);
    }

    private limitReached(limit: number): boolean {
        return limit > 0 && this.buffer.length >= limit;
    }

    private sliceBuffer(limit: number): T[] {
        if (limit <= 0) {
            limit = this.buffer.length;
        }
        const results = this.buffer.slice(0, limit);
        this.buffer = this.buffer.slice(limit);
        return results;
    }
}
