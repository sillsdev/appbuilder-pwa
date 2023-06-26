export class MRUCache<TKey, TValue> {
    private capacity: number;
    private cache: Map<TKey, TValue>;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.cache = new Map<TKey, TValue>();
    }

    get(key: TKey): TValue | null {
        if (this.cache.has(key)) {
            const value = this.cache.get(key)!;
            this.cache.delete(key);
            this.cache.set(key, value);
            return value;
        }
        return null;
    }

    put(key: TKey, data: TValue): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size === this.capacity) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, data);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }

    print(): void {
        console.log('Cache Contents:');
        for (let [key, value] of this.cache) {
            console.log(`${key}:`, value);
        }
    }
}
