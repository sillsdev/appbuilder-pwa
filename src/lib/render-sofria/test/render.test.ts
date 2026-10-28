import { describe, expect, test, vi } from 'vitest';
import { renderUsfm } from './renderUsfm';

// $lib/data/audio spawns a Web Worker at import time; render-sofria only needs these two functions
vi.mock('$lib/data/audio', () => ({ hasAudioPlayed: () => false, seekToVerse: () => {} }));

// jsdom does not implement innerText; several features set it (chapter numbers, captions)
Object.defineProperty(HTMLElement.prototype, 'innerText', {
    configurable: true,
    get() {
        return this.textContent;
    },
    set(value: string) {
        this.textContent = value;
    }
});

const chapter = (body: string) => `\\c 1\n\\p\n${body}\n`;

describe('paragraphs', () => {
    test('\\p renders a div with class p', () => {
        const root = renderUsfm(chapter('\\v 1 In the beginning.'));
        expect(root.querySelector('div.p')?.textContent).toContain('In the beginning.');
    });

    test('\\b renders a div containing a non-breaking space', () => {
        const root = renderUsfm('\\c 1\n\\p\n\\v 1 One.\n\\b\n\\p\n\\v 2 Two.\n');
        expect(root.querySelector('div.b')?.innerHTML).toBe('&nbsp;');
    });
});

describe('chapter and verse numbers', () => {
    test('chapter number renders as div.c', () => {
        const root = renderUsfm(chapter('\\v 1 Text.'));
        expect(root.querySelector('div.c')?.textContent).toBe('1');
    });

    test('chapter number renders as div.c-drop', () => {
        const root = renderUsfm(chapter('\\v 1 One. \\v 2 Two.'), {
            features: {
                'chapter-number-format': 'drop-cap',
                'hide-verse-number-1': true
            }
        });
        expect(root.querySelector('div.m')?.textContent).toContain('1');
        expect(root.querySelector('div.c-drop')?.textContent).toBe('1');
        const verses = [...root.querySelectorAll('span.v')].map((v) => v.textContent);
        expect(verses).toEqual(['2']);
    });

    test('verse number renders as span.v', () => {
        const root = renderUsfm(chapter('\\v 1 One. \\v 2 Two.'));
        const verses = [...root.querySelectorAll('span.v')].map((v) => v.textContent);
        expect(verses).toEqual(['1', '2']);
    });
});

describe('generic character markers', () => {
    test.each([
        'add',
        'bd',
        'it',
        'nd',
        'sig',
        'bk',
        'ord',
        'qs',
        'tl',
        'dc',
        'em',
        'no',
        'k',
        'pn'
    ])('\\%s renders span.%s around its text', (marker) => {
        const root = renderUsfm(chapter(`\\v 1 before \\${marker} inside\\${marker}* after`));
        const span = root.querySelector(`span.${marker}`);
        expect(span?.textContent).toBe('inside');
    });

    test('nested \\+nd inside \\add', () => {
        const root = renderUsfm(chapter('\\v 1 \\add outer \\+nd LORD\\+nd* text\\add*'));
        expect(root.querySelector('span.add span.nd')?.textContent).toBe('LORD');
    });
});

describe('words of Jesus', () => {
    const usfm = chapter('\\v 1 He said, \\wj Follow me.\\wj*');
    test('red letters on → span.wj', () => {
        expect(renderUsfm(usfm, { redLetters: true }).querySelector('span.wj')?.textContent).toBe(
            'Follow me.'
        );
    });
    test('red letters off → no span.wj, text kept', () => {
        const root = renderUsfm(usfm, { redLetters: false });
        expect(root.querySelector('span.wj')).toBeNull();
        expect(root.textContent).toContain('Follow me.');
    });
});

describe('footnotes', () => {
    test('\\f renders caller sup and hidden content', () => {
        const root = renderUsfm(chapter('\\v 1 Text\\f + \\fr 1:1 \\ft A note.\\f* more.'));
        const graft = root.querySelector('span[data-graft]');
        expect(graft?.querySelector('sup.footnote')?.textContent).toBe('a ');
        const content = graft?.querySelector(`div[id="${graft.getAttribute('data-graft')}"]`);
        expect(content?.querySelector('span.ft')?.textContent).toContain('A note.');
    });
});

describe('tables', () => {
    test('\\tr/\\tc render table cells', () => {
        const root = renderUsfm(
            '\\c 1\n\\p\n\\v 1 Table:\n\\tr \\tc1 A \\tc2 B\n\\tr \\tc1 C \\tc2 D\n'
        );
        const cells = [...root.querySelectorAll('table td')].map((td) => td.textContent?.trim());
        expect(cells).toEqual(['A', 'B', 'C', 'D']);
    });
});

describe('\\jmp links', () => {
    test('https href renders a.web-link', () => {
        const root = renderUsfm(chapter('\\v 1 See \\jmp site|href="https://example.org"\\jmp*.'));
        const a = root.querySelector('a.web-link');
        expect(a?.getAttribute('href')).toBe('https://example.org');
        expect(a?.textContent).toBe('site');
    });
    test('javascript: href does not render a link', () => {
        const root = renderUsfm(chapter('\\v 1 See \\jmp bad|href="javascript:alert(1)"\\jmp*.'));
        expect(root.querySelector('a[href^="javascript:alert"]')).toBeNull();
        expect(root.textContent).toContain('bad');
    });
});

describe('SAB SFM extensions (via convert filters)', () => {
    test('\\c_XXX character style renders span.c_XXX', () => {
        const root = renderUsfm(chapter('\\v 1 plain \\c_red styled text\\c_red* plain'));
        expect(root.querySelector('span.c_red')?.textContent).toBe(' styled text');
    });

    test('\\p_XXX paragraph style adds the class to the paragraph', () => {
        const root = renderUsfm('\\c 1\n\\p_callout\n\\v 1 Boxed text.\n');
        expect(root.querySelector('div.p_callout')?.textContent).toContain('Boxed text.');
    });

    test('\\zuli1 marks the paragraph as a list item', () => {
        const root = renderUsfm(
            '\\c 1\n\\p\n\\v 1 Intro.\n\\zuli1 First item\n\\zuli1 Second item\n'
        );
        const items = [...root.querySelectorAll('div.list-item')].map((d) => d.textContent?.trim());
        expect(items).toEqual(['First item', 'Second item']);
    });

    test('markdown [label](GEN.1.2) becomes an internal reference link', () => {
        const root = renderUsfm(chapter('\\v 1 See [next verse](GEN.1.2) here.'));
        const a = root.querySelector('a.ref-link');
        expect(a?.textContent).toBe('next verse');
        expect(a?.getAttribute('data-link')).toBe('C01.GEN.1.2');
    });

    test("Strong's numbers are stripped from \\w", () => {
        const root = renderUsfm(chapter('\\v 1 \\w In|strong="H0430"\\w* the beginning'));
        expect(root.querySelector('span.w')).toBeNull();
        expect(root.textContent).toContain('In the beginning');
    });
});

describe('nested markup inside footnotes', () => {
    test('\\+add inside \\ft stays inside the footnote content', () => {
        const root = renderUsfm(
            chapter('\\v 1 Text\\f + \\ft A \\+add nested\\+add* note.\\f* more.')
        );
        const graft = root.querySelector('span[data-graft]')!;
        const content = graft.querySelector(`div[id="${graft.getAttribute('data-graft')}"]`)!;
        expect(content.querySelector('span.ft span.add')?.textContent).toBe('nested');
        expect(content.querySelector('div.seltxt')).toBeNull();
    });
});
