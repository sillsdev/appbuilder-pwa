import { describe, expect, test } from 'vitest';
import { BufferedReader } from '../buffered-reader';

class TestBufferedInput {
    i = 0;
    input = [[1, 2, 3, 4], [5, 6], [7], [], [], [8], [9, 10, 11, 12, 13], [14, 15]];

    async read(limit: number): Promise<number[]> {
        const data = this.input[this.i];
        this.i++;
        return data;
    }

    done() {
        return this.i === this.input.length;
    }
}

describe('BufferedReader', () => {
    test('reads all by default', async () => {
        const input = new TestBufferedInput();
        const reader = new BufferedReader(input);
        const data = await reader.read();
        expect(data.length).toBe(15);
    });

    test('passes limit to inner read function', async () => {
        let hasRead = false;

        function read(limit: number): Promise<number[]> {
            hasRead = true;
            expect(limit).toBe(5);
            return Promise.resolve([]);
        }

        const reader = new BufferedReader({
            read,
            done: () => hasRead
        });
        await reader.read(5);
    });

    describe('Read six at a time', async () => {
        const input = new TestBufferedInput();
        const reader = new BufferedReader(input);
        const list1 = await reader.read(6);
        const list2 = await reader.read(6);
        const list3 = await reader.read(6);
        const list4 = await reader.read(6);

        test('First list has 6 items', () => {
            expect(list1.length).toBe(6);
        });

        test('Second list has 6 items', () => {
            expect(list2.length).toBe(6);
        });

        test('Third list has 3 items', () => {
            expect(list3.length).toBe(3);
        });

        test('Last list has no items', () => {
            expect(list4.length).toBe(0);
        });
    });
});
