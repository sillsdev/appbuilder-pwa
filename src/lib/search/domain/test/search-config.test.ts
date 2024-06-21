import { expect, test } from 'vitest';
import type { SearchConfigRepository, SubstitutionMap } from '../interfaces/data-interfaces';
import { SearchConfig } from '../use-cases/search-config';

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
}

const config = new SearchConfig(new TestSearchConfigRepository());

test('adds docSet', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: false,
        locale: 'eng'
    });
    expect(options.docSet).toBe('myDocSet');
});

test('adds collection', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: false,
        locale: 'eng'
    });
    expect(options.collection).toBe('eng');
});

test('adds whole words', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: true,
        matchAccents: false,
        locale: 'eng'
    });
    expect(options.wholeWords).toBe(true);
});

test('adds ignore if ignoring accents', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: false,
        locale: 'eng'
    });
    expect(options.ignore).toBe('xyz');
});

test('omits ignore if matching accents', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: true,
        locale: 'eng'
    });
    expect(options.ignore).toBeFalsy();
});

test('adds substitute if ignoring accents', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: false,
        locale: 'eng'
    });
    expect(options.substitute).toEqual({ a: 'bcde' });
});

test('omits ignore if matching accents', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: true,
        locale: 'eng'
    });
    expect(options.substitute).toBeFalsy();
});

test('includes user locale', () => {
    const options = config.configureOptions({
        collection: 'eng',
        wholeWords: false,
        matchAccents: true,
        locale: 'tr'
    });
    expect(options.locale).toBe('tr');
});
