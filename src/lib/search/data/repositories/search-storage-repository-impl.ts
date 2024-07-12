import type {
    SearchStorageData,
    SearchStorageRepository
} from '$lib/search/domain/interfaces/data-interfaces';

/**
 * Persistent storage for saving search results
 */
export class SearchStorageRepositoryImpl implements SearchStorageRepository {
    async save(data: SearchStorageData): Promise<void> {
        localStorage.setItem('search-results', JSON.stringify(data));
    }

    async read(): Promise<SearchStorageData> {
        const data = localStorage.getItem('search-results');
        return data ? JSON.parse(data) : null;
    }
}
