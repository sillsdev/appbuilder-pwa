import config from '$lib/data/config';

export interface BookCollection {
    id: string;
    languageCode: string;
}

export class ConfigRepository {
    searchAccentsToRemove(): string {
        return config.mainFeatures['search-accents-to-remove'];
    }

    bookCollection(id: string): BookCollection {
        return config.bookCollections.find((bc) => bc.id === id);
    }
}
