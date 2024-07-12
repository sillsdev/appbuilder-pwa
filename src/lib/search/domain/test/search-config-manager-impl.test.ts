import { expect, test } from 'vitest';
import type { SearchConfigRepository, SubstitutionMap } from '../interfaces/data-interfaces';
import { SearchConfigManagerImpl } from '../search-config-manager-impl';

class TestSearchConfigRepository implements SearchConfigRepository {
    searchIgnore(): string {
        return 'xyz';
    }
    searchSubtitute(): SubstitutionMap {
        return { a: 'bcde' };
    }
    collectionToDocSet(collection: string): string {
        return 'myDocSet';
    }
    userLanguage(): string {
        return 'tr';
    }
}

const config = new SearchConfigManagerImpl(new TestSearchConfigRepository());

test('adds docSet', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: false
    });
    expect(options.docSet).toBe('myDocSet');
});

test('adds collection', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: false
    });
    expect(options.collection).toBe('eng');
});

test('adds whole words', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: true,
        matchAccents: false
    });
    expect(options.wholeWords).toBe(true);
});

test('adds ignore if ignoring accents', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: false
    });
    expect(options.ignore).toBe('xyz');
});

test('omits ignore if matching accents', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: true
    });
    expect(options.ignore).toBeFalsy();
});

test('adds substitute if ignoring accents', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: false
    });
    expect(options.substitute).toEqual({ a: 'bcde' });
});

test('omits ignore if matching accents', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: true
    });
    expect(options.substitute).toBeFalsy();
});

test('includes user locale', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: true
    });
    expect(options.locale).toBe('tr');
});
