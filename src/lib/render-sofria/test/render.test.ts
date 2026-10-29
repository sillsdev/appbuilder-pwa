import { describe, expect, test, vi } from 'vitest';
import { renderUsfm } from './renderUsfm';

/**
 * TODO:
 * - audio-clips
 * - cross-references (handle in PR #1173)
 * - custom tags (handle in separate PR)
 * - illustrations
 * - introductions
 * - ordered lists
 * - verse divs
 * - ref-links (handle in PR #1173)
 * - titles
 * - videos
 * - ChordPro (handle in PR #1176)
 * - table headers (handle in PR #1178)
 */

// $lib/data/audio spawns a Web Worker at import time; render-sofria only needs these two functions
vi.mock('$lib/data/audio', () => ({ hasAudioPlayed: () => false, seekToVerse: () => {} }));

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
            chapter('\\v 1 Table:\n\\tr \\tc1 A \\tc2 B \\tc3 C\n\\tr \\tc1 D \\tc2 E \\tc3 F')
        );
        const cells = [...root.querySelectorAll('table td')].map((td) => td.textContent?.trim());
        expect(cells).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    });

    test('\\tr/\\tc render table cells with tc1-2 in row 2', () => {
        const root = renderUsfm(
            chapter('\\v 1 Table:\n\\tr \\tc1 A \\tc2 B \\tc3 C\n\\tr \\tc1-2 D E \\tc3 F')
        );
        const cells = [...root.querySelectorAll('table td')].map((td) => td.textContent?.trim());
        expect(cells).toEqual(['A', 'B', 'C', 'D E', 'F']);
    });

    test('\\tr/\\tc render table cells with tc2-3 in row 2', () => {
        const root = renderUsfm(
            chapter('\\v 1 Table:\n\\tr \\tc1 A \\tc2 B \\tc3 C\n\\tr \\tc1 D \\tc2-3 E F')
        );
        const cells = [...root.querySelectorAll('table td')].map((td) => td.textContent?.trim());
        expect(cells).toEqual(['A', 'B', 'C', 'D', 'E F']);
    });

    test('\\tr/\\tc render table cells with tc1-2 in row 1', () => {
        const root = renderUsfm(
            chapter('\\v 1 Table:\n\\tr \\tc1-2 A B \\tc3 C\n\\tr \\tc1 D \\tc2 E \\tc3 F')
        );
        const cells = [...root.querySelectorAll('table td')].map((td) => td.textContent?.trim());
        expect(cells).toEqual(['A B', 'C', 'D', 'E', 'F']);
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
});

// Footnotes adapted from real projects (\add is not valid inside notes in USFM 3.1)
describe('nested markup inside footnotes', () => {
    const renderNote = (note: string) => {
        const root = renderUsfm(chapter(`\\v 1 Text${note} more.`));
        const graft = root.querySelector('span[data-graft]')!;
        const content = graft.querySelector(`div[id="${graft.getAttribute('data-graft')}"]`)!;
        return { root, content };
    };

    test.each([
        ['it', '\\f + \\fr 3:20 \\fq Hewa \\ft bi îbranî \\+it jiyan\\+it* e.\\f*', 'jiyan'],
        ['nd', '\\f + \\fr 1:6 \\ft hinanggan \\+nd Apu Dios\\+nd*.\\f*', 'Apu Dios'],
        ['w', '\\f + \\fr 1:1 \\ft bnêre \\+w Yahweh\\+w*\\f*', 'Yahweh']
    ])('\\+%s inside \\ft stays inside the footnote content', (marker, note, inner) => {
        const { root, content } = renderNote(note);
        expect(content.querySelector(`span.ft span.${marker}`)?.textContent).toBe(inner);
        expect(content.querySelector('div.seltxt')).toBeNull();
        // the footnote must not consume a main-text phrase id
        const phrases = [...root.querySelectorAll('div.seltxt')].map((d) => d.id);
        expect(phrases).toEqual(['1a', '1b']);
    });

    // BUG: the nested span wraps a block div: <span class="it"><div class="txs">jiyan</div></span>
    test.fails('nested markup inside \\ft contains no block elements', () => {
        const { content } = renderNote('\\f + \\ft bi îbranî \\+it jiyan\\+it* e.\\f*');
        expect(content.querySelector('span.it div')).toBeNull();
    });
});

describe('glossary words', () => {
    test("Strong's numbers are stripped from \\w", () => {
        const root = renderUsfm(chapter('\\v 1 \\w In|strong="H0430"\\w* the beginning'));
        expect(root.querySelector('span.w')).toBeNull();
        expect(root.textContent).toContain('In the beginning');
    });

    test('glossary words are present', () => {
        const root = renderUsfm(chapter('\\v 1 fruit from the \\w tree\\w*'), {
            traits: { 'has-glossary': true },
            settings: { 'glossary-words': true },
            bcGlossary: ['tree']
        });
        expect(root.querySelector('span.glossary')?.textContent).toEqual('tree');
        expect(root.querySelector('span.glossary')?.getAttribute('data-match')).toBeNull();
    });

    test('glossary words use lemma', () => {
        const root = renderUsfm(chapter('\\v 1 fruit from the \\w trees|tree\\w*'), {
            traits: { 'has-glossary': true },
            settings: { 'glossary-words': true },
            bcGlossary: ['tree']
        });
        expect(root.querySelector('span.glossary')?.textContent).toEqual('trees');
        expect(
            root.querySelector('span.glossary a[data-match]')?.getAttribute('data-match')
        ).toEqual('tree');
    });
});

// https://docs.usfm.bible/usfm/3.1/para/titles-sections/index.html (\mt# and \mte# are titles)
describe('headings', () => {
    const heading = (markers: string) => renderUsfm(`\\c 1\n${markers}\n\\p\n\\v 1 Text.\n`);

    test('\\s1 renders div.s with an id', () => {
        const root = heading('\\s1 The Creation');
        const s = root.querySelector('div.s');
        expect(s?.id).toBe('s1');
        expect(s?.textContent).toBe('The Creation');
    });

    test('\\s2-\\s4 keep their level in the class', () => {
        const root = heading('\\s2 Two\n\\s3 Three\n\\s4 Four');
        expect(root.querySelector('div.s2')?.textContent).toBe('Two');
        expect(root.querySelector('div.s3')?.textContent).toBe('Three');
        expect(root.querySelector('div.s4')?.textContent).toBe('Four');
    });

    test('ids count headings by marker prefix, not by level (as legacy did)', () => {
        const root = heading('\\s1 First\n\\s2 Second\n\\s1 Third');
        const ids = [...root.querySelectorAll('div.s, div.s2')].map((d) => d.id);
        expect(ids).toEqual(['s1', 's2', 's3']);
    });

    test('\\ms1 and \\mr render major section heading and range', () => {
        const root = heading('\\ms1 Book One\n\\mr (Psalms 1–41)');
        expect(root.querySelector('div.ms#ms1')?.textContent).toBe('Book One');
        expect(root.querySelector('div.mr#mr1')?.textContent).toBe('(Psalms 1–41)');
    });

    test('\\sr renders section range', () => {
        const root = heading('\\s1 Head\n\\sr (1:1-5)');
        expect(root.querySelector('div.sr#sr1')?.textContent).toBe('(1:1-5)');
    });

    test('\\r renders parallel references', () => {
        const root = heading('\\s1 Head\n\\r (John 1:1-3)');
        expect(root.querySelector('div.r#r1')?.textContent).toBe('(John 1:1-3)');
    });

    test('\\sp renders speaker identification', () => {
        const root = heading('\\sp Lover');
        expect(root.querySelector('div.sp#sp1')?.textContent).toBe('Lover');
    });

    test('a heading mid-chapter is placed between the verses', () => {
        const root = renderUsfm('\\c 1\n\\p\n\\v 1 One.\n\\s1 Mid\n\\p\n\\v 2 Two.\n');
        const s = root.querySelector('div.s')!;
        expect(s.previousElementSibling?.getAttribute('data-verse')).toBe('1');
        expect(s.nextElementSibling?.getAttribute('data-verse')).toBe('2');
    });

    test('empty \\s5 (translationStudio chunk marker) renders nothing', () => {
        const root = renderUsfm('\\c 1\n\\s5\n\\p\n\\v 1 One.\n\\s5\n\\p\n\\v 2 Two.\n');
        expect(root.querySelector('div.s5')).toBeNull();
        const verses = [...root.querySelectorAll('span.v')].map((v) => v.textContent);
        expect(verses).toEqual(['1', '2']);
    });

    test('\\d renders a descriptive title before verse 1', () => {
        const root = renderUsfm('\\c 1\n\\d A psalm of David.\n\\q1\n\\v 1 Text.\n');
        const d = root.querySelector('div.d')!;
        expect(d.textContent).toBe('A psalm of David.');
        expect(d.nextElementSibling?.getAttribute('data-verse')).toBe('1');
    });

    test('\\d containing \\v 1 puts verse 1 inside the title', () => {
        const root = renderUsfm('\\c 1\n\\d \\v 1 A psalm of David.\n\\q1\n\\v 2 Text.\n');
        expect(root.querySelector('div.d span.v')?.textContent).toBe('1');
        expect(root.querySelector('div.d')?.textContent).toContain('A psalm of David.');
    });

    test('\\cd renders a chapter description', () => {
        const root = heading('\\cd About the chapter.');
        expect(root.querySelector('div.cd')?.textContent).toBe('About the chapter.');
    });

    test.each([
        ['nd', 'Praise the \\nd Lord\\nd*', 'Lord', 'Praise the Lord'],
        ['it', 'The \\it Holy\\it* Land', 'Holy', 'The Holy Land'],
        ['w', 'The \\w Lord\\w* speaks', 'Lord', 'The Lord speaks']
    ])('\\%s inside \\s1 renders span.%s in the heading', (marker, content, inner, full) => {
        const s = heading(`\\s1 ${content}`).querySelector('div.s')!;
        expect(s.querySelector(`span.${marker}`)?.textContent).toBe(inner);
        expect(s.textContent).toBe(full);
    });

    // BUG: the character span wraps a block div: <span class="nd"><div class="txs">Lord</div></span>
    test.fails('character markup inside a heading contains no block elements', () => {
        const s = heading('\\s1 Praise the \\nd Lord\\nd*').querySelector('div.s')!;
        expect(s.querySelector('span.nd div')).toBeNull();
    });

    test('footnote inside \\s1 stays in the heading', () => {
        const s = heading('\\s1 Heading\\f + \\fr 1:1 \\ft Note.\\f* end').querySelector('div.s')!;
        const graft = s.querySelector('span[data-graft]')!;
        expect(graft.querySelector('sup.footnote')).not.toBeNull();
        const content = graft.querySelector(`div[id="${graft.getAttribute('data-graft')}"]`);
        expect(content?.querySelector('span.ft')?.textContent).toBe('Note.');
        expect(s.querySelector(':scope > div.txs:last-child')?.textContent).toBe(' end');
    });

    // BUG: plain \r text is appended to the heading immediately but the \xt span is added at
    // endParagraph, so this renders "()Mark 1:1"
    test.fails('\\xt inside \\r keeps its position in the text', () => {
        const r = heading('\\s1 Head\n\\r (\\xt Mark 1:1\\xt*)').querySelector('div.r');
        expect(r?.textContent).toBe('(Mark 1:1)');
    });

    // \cl occurs ~8.6k times in Scriptoria projects and is currently dropped (legacy has no
    // handling for it either); expected behaviour not decided yet
    test.todo('\\cl chapter label');
    // cross-references currently throw in the harness (handle in PR #1173)
    test.todo('\\x inside \\s1');
    test.todo('\\sd# semantic division renders vertical space');
});
