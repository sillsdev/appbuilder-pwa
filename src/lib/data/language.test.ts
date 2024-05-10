import { test, expect, describe } from 'vitest';
import { findBestLanguage, findLanguage } from './language';

describe('findLanguage', () => {
    test('findLanguage returns exact match', () => {
        expect(findLanguage('en', ['en', 'fr', 'es'])).toBe('en');
    });

    test('findLanguage returns more general match', () => {
        expect(findLanguage('en-US', ['en', 'fr', 'es'])).toBe('en');
    });

    test('findLanguage returns similar', () => {
        expect(findLanguage('en-US', ['en-UK', 'fr', 'es'])).toBe('en-UK');
    });

    test('findLanguage preferes general match over fuzzy match', () => {
        expect(findLanguage('en-US', ['en-UK', 'en', 'fr', 'es'])).toBe('en');
    });
});

describe('findBestLanguage', () => {
    test('first preference has exact match', () => {
        expect(findBestLanguage(['en', 'fr'], 'es', ['fr', 'en', 'es'])).toBe('en');
    });

    test('first preference no match, second preference exact match', () => {
        expect(findBestLanguage(['zh', 'fr'], 'es', ['fr', 'en', 'es'])).toBe('fr');
    });

    test('first preference has fuzzy match', () => {
        expect(findBestLanguage(['en-US', 'fr'], 'es', ['fr', 'en', 'es'])).toBe('en');
    });

    test('first preference no match, second preference fuzzy match', () => {
        expect(findBestLanguage(['zh', 'fr-XX'], 'es', ['fr', 'en', 'es'])).toBe('fr');
    });

    test('if no preference returns fallback', () => {
        expect(findBestLanguage([], 'es', ['fr', 'es', 'en'])).toBe('es');
    });
});
