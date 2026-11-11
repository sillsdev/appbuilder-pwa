import { afterEach, describe, expect, test, vi } from 'vitest';
import ScopeManager from '../ScopeManager';

describe('ScopeManager top-of-stack assertions', () => {
    afterEach(() => vi.restoreAllMocks());

    const withParagraph = () => {
        const sm = new ScopeManager();
        sm.push('paragraph:main', document.createElement('div'));
        return sm;
    };

    test.each([
        ['pop', (sm: ScopeManager) => sm.pop('paragraph:main')],
        ['top', (sm: ScopeManager) => sm.top('paragraph:main')],
        ['promoteContent', (sm: ScopeManager) => sm.promoteContent('paragraph:main')]
    ])('%s throws on an empty stack', (_name, call) => {
        expect(() => call(new ScopeManager())).toThrow(/empty stack/);
    });

    test.each([
        ['pop', (sm: ScopeManager) => sm.pop('verses')],
        ['top', (sm: ScopeManager) => sm.top('verses')],
        ['promoteContent', (sm: ScopeManager) => sm.promoteContent('verses')]
    ])('%s throws when the top scope does not match', (_name, call) => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(() => call(withParagraph())).toThrow(/scope verses but found paragraph:main/);
    });

    test('top returns the top scope without removing it', () => {
        const sm = withParagraph();
        const root = sm.top('paragraph:main').root;
        expect(sm.pop('paragraph:main').root).toBe(root);
    });

    test('pop removes the top scope', () => {
        const sm = withParagraph();
        sm.pop('paragraph:main');
        expect(sm.has('paragraph:main')).toBe(false);
    });
});
