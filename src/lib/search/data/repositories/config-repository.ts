import config from '$lib/data/config';

export interface BookCollection {
    id: string;
    languageCode: string;
}

/**
 * Interface for retrieving data from config.js
 *
 * This is useful for dependency injection in a test environment
 */
export class ConfigRepository {
    searchAccentsToRemove(): string {
        return config.mainFeatures['search-accents-to-remove'];
    }

    bookCollection(id: string): BookCollection {
        return config.bookCollections.find((bc) => bc.id === id);
    }
}
