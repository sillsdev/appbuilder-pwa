import { describe, expect, test } from 'vitest';
import { SearchConfigRepositoryImpl } from '../repositories/search-config-repository-impl';
import { ConfigRepository, type BookCollection } from '../repositories/config-repository';

class TestConfigRepository extends ConfigRepository {
    searchAccentsToRemove(): string {
        return '\\u0300 \\u0301 á>a \\u0302 à>a è>e é>e';
    }

    bookCollection(id: string): BookCollection {
        return { id: 'WEB', languageCode: 'eng' };
    }
}

const repo = new SearchConfigRepositoryImpl(new TestConfigRepository());

test('ignored characters', () => {
    const ignored = repo.searchIgnore();
    expect(ignored).toBe('\u0300\u0301\u0302');
});

test('substitute characters', () => {
    const substitute = repo.searchSubtitute();
    const expected = {
        á: 'a',
        à: 'a',
        a: 'àá',
        é: 'e',
        è: 'e',
        e: 'èé'
    };
    for (const k of Object.keys(expected)) {
        expect(substitute[k]).toBeDefined;
        for (const c of expected[k]) {
            expect(substitute[k]).toContain(c);
        }
    }
});

test('collectionToDocSet', () => {
    const docSet = repo.collectionToDocSet('test');
    expect(docSet).toBe('eng_WEB');
});
