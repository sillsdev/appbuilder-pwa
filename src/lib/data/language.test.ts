import { test, expect } from 'vitest';
import { findLanguage } from './language';

test('findLanguage returns exact match', () => {
    expect(findLanguage('en', 'es', ['en', 'fr', 'es'])).toBe('en');
});

test('findLanguage returns fallback if no match', () => {
    expect(findLanguage('sh', 'es', ['en', 'fr', 'es'])).toBe('es');
});

test('findLanguage returns more general match', () => {
    expect(findLanguage('en-US', 'es', ['en', 'fr', 'es'])).toBe('en');
});

test('findLanguage returns similar', () => {
    expect(findLanguage('en-US', 'es', ['en-UK', 'fr', 'es'])).toBe('en-UK');
});

test('findLanguage preferes general match over fuzzy match', () => {
    expect(findLanguage('en-US', 'es', ['en-UK', 'en', 'fr', 'es'])).toBe('en');
});
