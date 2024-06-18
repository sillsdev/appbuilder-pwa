import { initProskomma, loadDocSetIfNotLoaded } from '$lib/data/scripture';
import type { SABProskomma } from '$lib/sab-proskomma';

import type {
    QueryVerseProvider,
    ScriptureRepository,
    SearchOptions
} from '../../domain/interfaces/data-interfaces';
import { ProskommaVerseProvider } from '../proskomma-verse-provider';

export class ScriptureRepositoryImpl implements ScriptureRepository {
    pk: SABProskomma;

    protected async init(docSet: string) {
        this.pk = await initProskomma({ fetch });
        await loadDocSetIfNotLoaded(this.pk, docSet, fetch);
    }

    async queryVerses(phrase: string, options: SearchOptions): Promise<QueryVerseProvider> {
        if (!this.pk) {
            await this.init(options.docSet);
        }
        return new ProskommaVerseProvider(this.pk, phrase, options);
    }
}
