import type {
    QueryVerseProvider,
    ScriptureRepository
} from '$lib/search-worker/domain/interfaces/data-interfaces';
import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
import type { ProskommaSearchRepository } from '../interfaces/pk-search-repository';
import { ProskommaVerseProvider } from '../pk-verse-provider';

/**
 * Uses Proskomma to retrieve Scripture content
 */
export class ScriptureRepositoryImpl implements ScriptureRepository {
    constructor(proskommaRepository: ProskommaSearchRepository) {
        this.proskommaRepo = proskommaRepository;
    }

    proskommaRepo: ProskommaSearchRepository;

    async queryVerses(phrase: string, options: SearchOptions): Promise<QueryVerseProvider> {
        return new ProskommaVerseProvider(this.proskommaRepo, phrase, options);
    }
}
