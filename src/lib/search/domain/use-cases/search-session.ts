import type { ScriptureRepository, SearchOptions } from '../interfaces/data-interfaces';
import type { SearchPresenter } from '../interfaces/presentation-interfaces';
import { SearchQuery } from './search-query';
import { SearchSessionBase } from './search-session-base';

export class SearchSession extends SearchSessionBase {
    constructor(presenter: SearchPresenter, scriptureRepository: ScriptureRepository) {
        super(presenter);
        this.scriptureRepository = scriptureRepository;
    }

    scriptureRepository: ScriptureRepository;

    protected createQuery(phrase: string, options: SearchOptions): SearchQuery {
        return new SearchQuery(phrase, options, this.scriptureRepository);
    }
}
