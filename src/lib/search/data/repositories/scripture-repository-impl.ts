import type {
    QueryVerseProvider,
    ScriptureRepository,
    SearchOptions
} from '../../domain/interfaces/data-interfaces';
import type { ProskommaSearchRepository } from '../interfaces/pk-search-repository';
import { ProskommaVerseProvider } from '../pk-verse-provider';

export class ScriptureRepositoryImpl implements ScriptureRepository {
    constructor(proskommaRepository: ProskommaSearchRepository) {
        this.proskommaRepo = proskommaRepository;
    }

    proskommaRepo: ProskommaSearchRepository;

    async queryVerses(phrase: string, options: SearchOptions): Promise<QueryVerseProvider> {
        return new ProskommaVerseProvider(this.proskommaRepo, phrase, options);
    }
}
