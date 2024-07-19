import type { SearchConfigRepository, SearchOptions } from './interfaces/data-interfaces';
import type { UserSearchOptions } from './interfaces/presentation-interfaces';

/**
 * Configues search based on user input
 *
 * Combines options immediately visible to the user (ex: whole words) with
 * application-wide settings not visible to the user (ex: locale).
 */
export class SearchConfigManagerImpl {
    constructor(searchConfigRepository: SearchConfigRepository) {
        this.repo = searchConfigRepository;
    }

    repo: SearchConfigRepository;

    configureOptions(options: UserSearchOptions): SearchOptions {
        const docSet = this.repo.collectionToDocSet(options.collection);
        const language = this.repo.userLanguage();
        const ignore = options.matchAccents ? undefined : this.repo.searchIgnore();
        const substitute = options.matchAccents ? undefined : this.repo.searchSubtitute();
        return {
            docSet,
            collection: options.collection,
            wholeWords: options.wholeWords,
            ignore,
            substitute,
            locale: language
        };
    }
}
