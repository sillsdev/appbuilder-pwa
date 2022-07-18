import { derived, readable, writable } from 'svelte/store';
import globalConfigJson from '../../config';

export const globalConfig = readable(globalConfigJson);
export const activeBookName = writable('john');
// Books are currently an array, which seems slower than necessary. Might be better as an object (for constant lookup time)
export const activeBook = derived(
    [activeBookName, globalConfig],
    ([$activeBookName, $globalConfig]) =>
        // FIXME: Currently no functionality for multiple book collections
        $globalConfig.bookCollections[0].books.find(
            (book) => book.name.toLowerCase() === $activeBookName.toLowerCase()
        )
);
