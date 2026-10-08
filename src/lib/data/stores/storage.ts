import { browser } from '$app/environment';
import { readable, writable } from 'svelte/store';

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A Svelte store that persists its value in localStorage.
 *
 * @param key The localStorage key
 * @param initial Initial value to use if nothing is stored
 */
export function persistedLocal<
    T,
    S extends typeof writable<T> | typeof readable<T> = typeof writable<T>
>(key: string, initial: T, storeType?: S): ReturnType<S> {
    // Start with initial value (safe for SSR)
    const start = (storeType ?? writable<T>)(initial, (set) => {
        if (browser) {
            // If there’s already something stored, load it
            const stored = localStorage.getItem(key);
            if (stored !== null) {
                try {
                    const parsed = JSON.parse(stored);
                    // Layer stored values over the initial object so keys added
                    // since the value was saved still get their defaults
                    set(
                        isPlainObject(initial) && isPlainObject(parsed)
                            ? ({ ...initial, ...parsed } as T)
                            : parsed
                    );
                } catch {
                    // if parsing fails, fall back to initial
                    set(initial);
                }
            }
        }
    });

    // Keep localStorage in sync
    start.subscribe((value) => {
        localStorage.setItem(key, JSON.stringify(value));
    });

    return start as ReturnType<S>;
}
