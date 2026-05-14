import config, { scriptureConfig } from '$assets/config';

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
    searchWholeWordsDefault(): boolean {
        return config.mainFeatures['search-whole-words-default'] as boolean;
    }

    searchAccentsDefault(): boolean {
        return config.mainFeatures['search-accents-default'] as boolean;
    }

    searchAccentsToRemove(): string {
        return config.mainFeatures['search-accents-to-remove'] as string;
    }

    bookCollection(id: string): BookCollection | undefined {
        return scriptureConfig.bookCollections?.find((bc) => bc.id === id);
    }
}
