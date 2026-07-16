export class MRUCache<TKey, TValue> {
    private capacity: number;
    private cache: Map<TKey, TValue>;
    private cleanupItem: undefined | ((item: TValue, key: TKey) => void);

    constructor(capacity: number, cleanupItem?: (item: TValue, key: TKey) => void) {
        this.capacity = capacity;
        this.cache = new Map<TKey, TValue>();
        this.cleanupItem = cleanupItem;
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
            this.delete(key);
        } else if (this.cache.size === this.capacity) {
            const firstKey = this.cache.keys().next().value;
            this.delete(firstKey!);
        }
        this.cache.set(key, data);
    }

    delete(key: TKey): void {
        if (this.cache.has(key)) {
            this.cleanupItem?.(this.cache.get(key)!, key);
            this.cache.delete(key);
        }
    }

    clear(): void {
        this.cache.keys().forEach((v) => this.cleanupItem?.(this.cache.get(v)!, v));
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }

    print(): void {
        console.log('Cache Contents:');
        for (const [key, value] of this.cache) {
            console.log(`${key}:`, value);
        }
    }
}
