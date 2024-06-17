import type { SABProskomma } from '$lib/sab-proskomma';
import { SearchQueryBase, type SearchOptions } from '../application';
import { SearchConfigHelpers } from './search-config';
import { ProksommaSearchInterface } from './proskomma-verse-provider';

/**
 * Implements search queries using Proskomma
 */
export class SearchQuery extends SearchQueryBase {
    constructor(
        searchPhrase: string,
        pk: SABProskomma,
        docSet: string,
        collection: string,
        options: SearchOptions
    ) {
        const configOptions = SearchConfigHelpers.getConfig();
        const verseProvider = new ProksommaSearchInterface.ProskommaVerseProvider({
            pk,
            searchPhrase,
            wholeWords: options.wholeWords,
            ignore: configOptions.ignore,
            substitute: configOptions.substitute,
            docSet,
            collection
        });
        options.substitute = configOptions.substitute;
        options.ignore = configOptions.ignore;
        super(searchPhrase, verseProvider, options);
    }
}
