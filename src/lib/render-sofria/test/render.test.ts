import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderUsfm } from './renderUsfm';

/**
 * TODO:
 * - audio-clips
 * - cross-references (handle in PR #1173)
 * - custom tags (handle in separate PR)
 * - ordered lists
 * - verse divs
 * - ref-links (handle in PR #1173)
 * - videos
 * - ChordPro (handle in PR #1176)
 * - table headers (handle in PR #1178)
 */

// $lib/data/audio spawns a Web Worker at import time; render-sofria only needs these two functions
vi.mock('$lib/data/audio', () => ({ hasAudioPlayed: () => false, seekToVerse: () => {} }));

// The convert filter removeMissingFigures drops \fig unless data/illustrations/<file> exists.
// data/ is gitignored, so treat every illustration as present unless its name starts with "missing".
vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('fs')>();
    const existsSync = (p: import('fs').PathLike) =>
        /data[\\/]illustrations[\\/]/.test(String(p))
            ? !/[\\/]missing[^\\/]*$/.test(String(p))
            : actual.existsSync(p);
    return { ...actual, default: { ...actual, existsSync }, existsSync };
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

    test('wrappers contain no block elements', () => {
        const root = renderUsfm(chapter('\\v 1 \\it jiyan\\it*'));
        expect(root.querySelector('span.it div')).toBeNull();
    });

    test('wrapper with phrase breaks is split', () => {
        const root = renderUsfm(chapter('\\v 1 \\it before, after\\it*'), {
            hasAudio: true,
            bibleBook: true
        });
        console.log(root.outerHTML);
        expect(root.querySelectorAll('div span.it').length).toBe(2);
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

    test('nested markup inside \\ft contains no block elements', () => {
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

    test('character markup inside a heading contains no block elements', () => {
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

// https://docs.usfm.bible/usfm/3.1/para/titles-sections/index.html (\mt# and \mte#)
describe('titles', () => {
    const chapter1 = '\\c 1\n\\p\n\\v 1 Text.\n';
    const titleBlock = (root: HTMLElement) => root.querySelector('div[data-verse="title"]');

    test('\\mt renders a scroll-item title block before the chapter number', () => {
        const root = renderUsfm(`\\mt Genesis\n${chapter1}`);
        const block = titleBlock(root)!;
        expect(block.classList.contains('scroll-item')).toBe(true);
        expect(block.querySelector('div.mt')?.textContent).toBe('Genesis');
        expect(block.nextElementSibling?.classList.contains('c')).toBe(true);
    });

    test('title block ends with two blank-line spacers', () => {
        const block = titleBlock(renderUsfm(`\\mt1 Genesis\n${chapter1}`))!;
        const tail = [...block.children].slice(-2).map((d) => d.className);
        expect(tail).toEqual(['b', 'b']);
    });

    test('\\mt1 uses class mt (Proskomma normalizes the 1)', () => {
        const block = titleBlock(renderUsfm(`\\mt1 Genesis\n${chapter1}`))!;
        expect(block.querySelector('div.mt')?.textContent).toBe('Genesis');
        expect(block.querySelector('div.mt1')).toBeNull();
    });

    test('\\mt2-\\mt4 keep their level and source order', () => {
        const root = renderUsfm(
            `\\mt2 The Book of\n\\mt1 Genesis\n\\mt3 or Beginnings\n\\mt4 small\n${chapter1}`
        );
        const lines = [...titleBlock(root)!.querySelectorAll('div[class^="mt"]')].map((d) => [
            d.className,
            d.textContent
        ]);
        expect(lines).toEqual([
            ['mt2', 'The Book of'],
            ['mt', 'Genesis'],
            ['mt3', 'or Beginnings'],
            ['mt4', 'small']
        ]);
    });

    test('title text is not a selectable phrase', () => {
        const block = titleBlock(renderUsfm(`\\mt1 Genesis\n${chapter1}`))!;
        expect(block.querySelector('.seltxt')).toBeNull();
    });

    test('title only renders with chapter 1', () => {
        const root = renderUsfm(`\\mt1 Genesis\n${chapter1}\\c 2\n\\p\n\\v 1 Two.\n`, {
            chapter: '2'
        });
        expect(titleBlock(root)).toBeNull();
        expect(root.querySelector('div.c')?.textContent).toBe('2');
    });

    test('title renders with the introduction', () => {
        const root = renderUsfm(`\\mt1 Genesis\n\\ip Intro.\n${chapter1}`, {
            hackRenderIntro: true
        });
        expect(titleBlock(root)?.querySelector('div.mt')?.textContent).toBe('Genesis');
        expect(root.querySelector('div.ip')?.textContent).toBe('Intro.');
    });

    test('title renders in a non-Bible book', () => {
        const root = renderUsfm(`\\mt1 Glossary\n${chapter1}`, { bibleBook: false });
        expect(titleBlock(root)?.querySelector('div.mt')?.textContent).toBe('Glossary');
    });

    test('footnote inside \\mt1 stays in the title', () => {
        const mt = titleBlock(
            renderUsfm(`\\mt1 Genesis\\f + \\fr 0:0 \\ft Title note.\\f*\n${chapter1}`)
        )!.querySelector('div.mt')!;
        const graft = mt.querySelector('span[data-graft]')!;
        expect(graft.querySelector('sup.footnote')).not.toBeNull();
        const content = graft.querySelector(`div[id="${graft.getAttribute('data-graft')}"]`);
        expect(content?.querySelector('span.ft')?.textContent).toBe('Title note.');
    });

    test('character markup inside \\mt1 renders its text once', () => {
        const mt = titleBlock(renderUsfm(`\\mt1 The \\it Good\\it* News\n${chapter1}`))!;
        expect(mt.querySelector('span.it')?.textContent).toBe('Good');
        expect(mt.querySelector('div.mt')?.textContent).toBe('The Good News');
    });

    // \mte is dropped wherever it appears (legacy has no handling either). ~200 uses in
    // Scriptoria projects, almost all placed before \c 1 rather than at the end of the book
    test.todo('\\mte main title at ending');
});

// https://docs.usfm.bible/usfm/3.1.1/para/introductions/index.html
// The introduction is only rendered when the view asks for it (hackRenderIntro), and then
// only the introduction is rendered, not the chapter.
describe('introductions', () => {
    const chapter1 = '\\c 1\n\\p\n\\v 1 Text.\n';
    const intro = (markers: string) =>
        renderUsfm(`${markers}\n${chapter1}`, { hackRenderIntro: true });

    test('introduction is not rendered with the chapter', () => {
        const root = renderUsfm(`\\ip Intro para.\n${chapter1}`);
        expect(root.querySelector('div.ip')).toBeNull();
        expect(root.querySelector('div.c')?.textContent).toBe('1');
    });

    test('chapter is not rendered with the introduction', () => {
        const root = intro('\\ip Intro para.');
        expect(root.querySelector('div.ip')?.textContent).toBe('Intro para.');
        expect(root.querySelector('div.c')).toBeNull();
        expect(root.querySelector('span.v')).toBeNull();
    });

    test.each(['ip', 'ipi', 'im', 'imi', 'ipq', 'imq', 'ipr', 'iex'])(
        '\\%s renders div.%s',
        (marker) => {
            const root = intro(`\\${marker} Some text.`);
            expect(root.querySelector(`div.${marker}`)?.textContent).toBe('Some text.');
        }
    );

    test('\\iq# and \\ili# keep their level (Proskomma normalizes the 1)', () => {
        const root = intro('\\iq1 Line one\n\\iq2 Line two\n\\ili1 Item one\n\\ili2 Item two');
        expect(root.querySelector('div.iq')?.textContent).toBe('Line one');
        expect(root.querySelector('div.iq2')?.textContent).toBe('Line two');
        expect(root.querySelector('div.ili')?.textContent).toBe('Item one');
        expect(root.querySelector('div.ili2')?.textContent).toBe('Item two');
    });

    test('\\ib renders div.ib', () => {
        const root = intro('\\ip Before.\n\\ib\n\\ip After.');
        const ib = root.querySelector('div.ib')!;
        expect(ib.previousElementSibling?.textContent).toBe('Before.');
        expect(ib.nextElementSibling?.textContent).toBe('After.');
    });

    test('\\is1 and \\is2 render as headings with ids', () => {
        const root = intro('\\is1 Section\n\\ip Text.\n\\is2 Sub section');
        expect(root.querySelector('div.is#is1')?.textContent).toBe('Section');
        expect(root.querySelector('div.is2#is2')?.textContent).toBe('Sub section');
    });

    test('\\imt# renders in a title block', () => {
        const root = intro('\\imt1 Introduction\n\\imt2 to Genesis\n\\ip Text.');
        const block = root.querySelector('div[data-verse="title"]')!;
        expect(block.querySelector('div.imt')?.textContent).toBe('Introduction');
        expect(block.querySelector('div.imt2')?.textContent).toBe('to Genesis');
    });

    test('\\mt# title block comes before the \\imt# title block', () => {
        const root = intro('\\mt1 Genesis\n\\imt1 Introduction\n\\ip Text.');
        const blocks = [...root.querySelectorAll('div[data-verse="title"]')];
        expect(blocks.map((b) => b.textContent)).toEqual(['Genesis', 'Introduction']);
    });

    test('\\iot and \\io1-\\io3 render the outline with \\ior references', () => {
        const root = intro(
            '\\iot Outline\n\\io1 Part one \\ior (1:1-3)\\ior*\n\\io2 Sub part \\ior 1:4\\ior*\n\\io3 Deep'
        );
        expect(root.querySelector('div.iot#iot1')?.textContent).toBe('Outline');
        expect(root.querySelector('div.io')?.textContent).toBe('Part one (1:1-3)');
        expect(root.querySelector('div.io span.ior')?.textContent).toBe('(1:1-3)');
        expect(root.querySelector('div.io2 span.ior')?.textContent).toBe('1:4');
        expect(root.querySelector('div.io3')?.textContent).toBe('Deep');
    });

    test('\\ie renders nothing', () => {
        const root = intro('\\ip Text.\n\\ie');
        expect(root.querySelector('div.ie')).toBeNull();
        expect(root.querySelector('div.ip')?.textContent).toBe('Text.');
    });

    test('introduction text is not selectable and uses +N ids (as legacy did)', () => {
        const root = intro('\\is1 Section\n\\ip One. Two.\n\\ip Three.');
        expect(root.querySelector('.seltxt')).toBeNull();
        const ids = [...root.querySelectorAll('div.txs')].map((d) => d.id);
        expect(ids.every((id) => /^\+\d+$/.test(id))).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test.each([
        ['bk', 'The \\bk Book\\bk* says', 'Book'],
        ['k', 'A \\k keyword\\k* here', 'keyword'],
        ['iqt', 'He said \\iqt quoted\\iqt* there', 'quoted']
    ])('\\%s inside \\ip renders span.%s', (marker, content, inner) => {
        const ip = intro(`\\ip ${content}`).querySelector('div.ip')!;
        expect(ip.querySelector(`span.${marker}`)?.textContent).toBe(inner);
    });

    test('\\xt inside \\ip renders a reference link', () => {
        const ip = intro('\\ip See \\xt Mark 1:1\\xt*.').querySelector('div.ip')!;
        expect(ip.querySelector('span.xt span.reflink')?.textContent).toBe('Mark 1:1');
        expect(ip.textContent).toBe('See Mark 1:1.');
    });

    test('footnote inside \\ip stays in the paragraph', () => {
        const ip = intro('\\ip Para\\f + \\fr 0:0 \\ft Note.\\f* end.').querySelector('div.ip')!;
        const graft = ip.querySelector('span[data-graft]')!;
        expect(graft.querySelector('sup.footnote')).not.toBeNull();
        const content = graft.querySelector(`div[id="${graft.getAttribute('data-graft')}"]`);
        expect(content?.querySelector('span.ft')?.textContent).toBe('Note.');
    });

    test('\\ior contains no block elements', () => {
        const root = intro('\\io1 Part one \\ior (1:1-3)\\ior*');
        expect(root.querySelector('span.ior div')).toBeNull();
    });

    // \ipc is new in USFM 3.1.1 and Proskomma does not support it. Not needed yet: SAB writes
    // \ipc as \pc in the PWA data files. Only 1 Scriptoria project uses \ipc.
    test.todo('\\ipc renders div.ipc');

    // \imte# (~260 uses) becomes an introEndTitle graft in Proskomma, which is not handled
    test.todo('\\imte# introduction ending title');
});

// \fig: https://docs.usfm.bible/usfm/3.1/char/features/fig.html
// Image src is not checked: it comes from an import.meta.glob of src/gen-assets/illustrations,
// which is gitignored and empty in CI.
describe('illustrations', () => {
    const imageBlock = (el: Element | null | undefined) => el?.querySelector('div.image-block');
    const caption = (el: Element | null | undefined) =>
        imageBlock(el)?.querySelector('div.caption span.caption')?.textContent;

    // The image block checks its src with a HEAD request and hides itself if that fails
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    beforeEach(() => vi.stubGlobal('fetch', fetchMock));
    afterEach(() => {
        vi.unstubAllGlobals();
        fetchMock.mockClear();
    });

    describe('\\fig in the text', () => {
        const twoParagraphs = (fig: string) =>
            `\\c 1\n\\p\n\\v 1 Text ${fig} more.\n\\v 2 Two.\n\\p\n\\v 3 Three.\n`;

        test('USFM 3 \\fig renders an image block with its caption', () => {
            const root = renderUsfm(
                twoParagraphs('\\fig A caption|src="pic.jpg" size="col"\\fig*')
            );
            expect(imageBlock(root)?.querySelector('span.image img')).not.toBeNull();
            expect(caption(root)).toBe('A caption');
        });

        test('caption text is not part of the verse text', () => {
            const root = renderUsfm(twoParagraphs('\\fig A caption|src="pic.jpg"\\fig*'));
            expect(root.querySelector('div[data-verse="1"] div.seltxt')?.textContent).toBe(
                'Text more. '
            );
        });

        test('\\fig is moved to the end of its paragraph (convert moveFigureToNextNonVerseMarker)', () => {
            const root = renderUsfm(twoParagraphs('\\fig A caption|src="pic.jpg"\\fig*'));
            const block = imageBlock(root)!;
            expect(block.closest('[data-verse]')?.getAttribute('data-verse')).toBe('2');
            expect(block.previousElementSibling?.textContent).toBe('Two.');
        });

        test('USFM 3 \\fig without a caption renders no caption', () => {
            const root = renderUsfm(twoParagraphs('\\fig |src="pic.jpg" size="col"\\fig*'));
            expect(imageBlock(root)).not.toBeNull();
            expect(root.querySelector('div.caption')).toBeNull();
            expect(root.textContent).not.toContain('NO_CAPTION');
        });

        test('\\fig whose image file is missing is removed', () => {
            const root = renderUsfm(twoParagraphs('\\fig A caption|src="missing.jpg"\\fig*'));
            expect(imageBlock(root)).toBeFalsy();
            expect(root.querySelector('div[data-verse="1"]')?.textContent).toContain('Text more.');
        });

        test('USFM 2 \\fig renders an image block', () => {
            const root = renderUsfm(
                twoParagraphs('\\fig Heads of barley|pic.png|col||Louise Bass|Barley|1:1\\fig*')
            );
            expect(imageBlock(root)).not.toBeNull();
        });

        // BUG (also in legacy): USFM 2 is DESC|FILE|SIZE|LOC|COPY|CAP|REF. CAP is the printed
        // caption, but the caption shown is DESC. ~5k of ~6.5k \fig in Scriptoria projects use
        // USFM 2 syntax; ~1.8k have an empty DESC, so their caption is lost entirely.
        test.fails.each([
            ['Heads of barley|pic.png|col||Louise Bass|Barley|1:1', 'Barley'],
            ['|pic.png|col|||Kaampono angguru|1.1', 'Kaampono angguru']
        ])('USFM 2 \\fig %s shows the CAP field as caption', (fig, cap) => {
            const root = renderUsfm(twoParagraphs(`\\fig ${fig}\\fig*`));
            expect(caption(root)).toBe(cap);
        });

        test('display-images-in-bible-text off hides \\fig in a Bible book', () => {
            const root = renderUsfm(twoParagraphs('\\fig A caption|src="pic.jpg"\\fig*'), {
                settings: { 'display-images-in-bible-text': 'off' }
            });
            expect(imageBlock(root)).toBeFalsy();
        });

        test('display-images-in-bible-text off still shows \\fig in a non-Bible book', () => {
            const root = renderUsfm(twoParagraphs('\\fig A caption|src="pic.jpg"\\fig*'), {
                bibleBook: false,
                settings: { 'display-images-in-bible-text': 'off' }
            });
            expect(caption(root)).toBe('A caption');
        });

        test('show-illustrations off hides \\fig', () => {
            const root = renderUsfm(twoParagraphs('\\fig A caption|src="pic.jpg"\\fig*'), {
                features: { 'show-illustrations': false }
            });
            expect(imageBlock(root)).toBeFalsy();
            expect(root.textContent).not.toContain('A caption');
        });

        test('image block is hidden when its image cannot be fetched', async () => {
            fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));
            const root = renderUsfm(twoParagraphs('\\fig A caption|src="pic.jpg"\\fig*'));
            await vi.waitFor(() =>
                expect(imageBlock(root)!.getAttribute('style')).toContain('display: none')
            );
            expect(fetchMock).toHaveBeenCalledWith(expect.anything(), { method: 'HEAD' });
        });

        test('zoom-illustrations opens a fullscreen popup on click', () => {
            const root = renderUsfm(twoParagraphs('\\fig A caption|src="pic.jpg"\\fig*'), {
                features: { 'zoom-illustrations': true }
            });
            imageBlock(root)!.querySelector('img')!.click();
            const popup = document.body.querySelector('div.fullscreen-popup');
            expect(popup?.querySelector('img')).not.toBeNull();
            popup!.querySelector<HTMLButtonElement>('button.close-btn')!.click();
            expect(document.body.querySelector('div.fullscreen-popup')).toBeNull();
        });
    });

    describe('illustrations placed by the appDef (config.illustrations)', () => {
        const usfm = '\\c 1\n\\p\n\\v 1 One.\n\\v 2 Two.\n\\p\n\\v 3 Three.\n';
        const placed = (pos: string, ref: string, collection = 'C01') => [
            {
                width: 100,
                height: 100,
                filename: 'pic.jpg',
                placement: { pos, ref, collection, caption: 'Placed' }
            }
        ];

        test('before: placed before the verse div', () => {
            const root = renderUsfm(usfm, { illustrations: placed('before', 'GEN 1:2') });
            const block = imageBlock(root)!;
            expect(caption(root)).toBe('Placed');
            expect(block.nextElementSibling?.getAttribute('data-verse')).toBe('2');
        });

        test('after: placed after the verse bookmarks (ref with dots)', () => {
            const root = renderUsfm(usfm, { illustrations: placed('after', 'GEN.1.2') });
            expect(imageBlock(root)!.previousElementSibling?.id).toBe('bookmarks2');
        });

        test('top: placed before the chapter number', () => {
            const root = renderUsfm(usfm, { illustrations: placed('top', 'GEN 1:1') });
            expect(imageBlock(root)!.nextElementSibling?.classList.contains('c')).toBe(true);
        });

        test('top with drop-cap chapter number: placed before the drop-cap paragraph', () => {
            const root = renderUsfm(usfm, {
                illustrations: placed('top', 'GEN 1:1'),
                features: { 'chapter-number-format': 'drop-cap' }
            });
            expect(imageBlock(root)!.nextElementSibling?.classList.contains('m')).toBe(true);
        });

        test('before verse 1 with drop-cap chapter number: placed before the drop cap', () => {
            const root = renderUsfm(usfm, {
                illustrations: placed('before', 'GEN 1:1'),
                features: { 'chapter-number-format': 'drop-cap' }
            });
            expect(imageBlock(root)!.nextElementSibling?.classList.contains('c-drop')).toBe(true);
        });

        test('bottom: placed after the last verse bookmarks', () => {
            const root = renderUsfm(usfm, { illustrations: placed('bottom', 'GEN 1:1') });
            expect(imageBlock(root)!.previousElementSibling?.id).toBe('bookmarks3');
        });

        test.each([
            ['another collection', placed('before', 'GEN 1:2', 'C02')],
            ['another chapter', placed('before', 'GEN 2:2')],
            ['another book', placed('before', 'EXO 1:2')]
        ])('not placed for %s', (_name, illustrations) => {
            expect(imageBlock(renderUsfm(usfm, { illustrations }))).toBeFalsy();
        });

        test('display-images-in-bible-text off hides placed illustrations', () => {
            const root = renderUsfm(usfm, {
                illustrations: placed('before', 'GEN 1:2'),
                settings: { 'display-images-in-bible-text': 'off' }
            });
            expect(imageBlock(root)).toBeFalsy();
        });
    });
});
