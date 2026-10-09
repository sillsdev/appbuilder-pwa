import type { DictionaryFieldConfig } from '$config';
import { describe, expect, test } from 'vitest';
import { getSubEntryIds, parseLiftEntry, type LiftEntry } from './liftEntry';
import { liftEntriesToHtml, type LiftHtmlOptions } from './liftHtmlWriter';

// Entries from the Gullah sample (data-gullah/data.sqlite)
const ENTRY_A = `<e id="0"><l><f l="0"><t>a</t></f></l><z type="summary-definition"><f l="1"><t>a</t></f></z><p><f l="0"><t>ʌ</t></f></p><s id="0"><h value="indefinite article"/><g l="1"><t>INDEF</t></g><d><f l="1"><t>a</t></f></d><q><f l="1"><t>a</t></f></q><x><f l="0"><t>Leh me tell ya a story. </t></f><a><f l="1"><t>L<span>et me tell you a story.</span></t></f></a></x><n type="reference"><f l="0"><t><span href="silfw://localhost/link" class="Hyperlink">Di Root  1.1</span></t></f></n><r type="cross ref" ref="S2"/></s></e>`;
const ENTRY_BEEN = `<e id="16"><l><f l="0"><t>been</t></f></l><p><f l="0"><t>bɪn</t></f></p><s id="16"><h value="copula verb"/><g l="1"><t>COP.PST</t></g><d><f l="1"><t>was/were</t></f></d></s><s id="17"><h value="preverbal particle"/><g l="1"><t>ANT</t></g><d><f l="1"><t>anterior preverbal marker</t></f></d></s><r type="subentry" ref="17"><tr name="complex-form-type" value="contraction"/></r></e>`;
const ENTRY_BEENA = `<e id="17"><m id="16"/><l><f l="0"><t>beena</t></f></l><s id="18"><h value="preverbal particle"/><g l="1"><t>PST.PROG</t></g></s></e>`;

const writingSystems = [
    { code: 'gul', vernacular: true, audio: false, enabled: true },
    { code: 'en', vernacular: false, audio: false, enabled: true }
];

function field(type: string, name: string, label: string, show = true): DictionaryFieldConfig {
    return {
        type,
        name,
        show,
        labelShown: label !== '',
        labels: label ? { default: label } : {},
        labelPosition: 'beside',
        beforeItem: '',
        afterItem: ''
    };
}

const fields = [
    field('complex', 'contraction', 'Contraction:'),
    field('field', 'summary-definition', ''),
    field('note', 'reference', 'Reference:'),
    field('pronunciation', '', ''),
    field('relation', 'cross ref', 'Cross ref:')
];

function parse(xml: string, homonymIndex = 0): LiftEntry {
    const entry = parseLiftEntry(xml, ['gul', 'en'], homonymIndex);
    expect(entry).toBeDefined();
    return entry!;
}

function options(overrides: Partial<LiftHtmlOptions> = {}): LiftHtmlOptions {
    return {
        mode: 'single',
        writingSystems,
        fields,
        language: 'en',
        homonymFormat: 'subscript',
        showIllustrations: false,
        resolveRelation: (ref) =>
            ref === 'S2' ? { id: 2, name: 'A', homonymIndex: 0 } : undefined,
        getSubEntry: () => undefined,
        ...overrides
    };
}

function render(html: string) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div;
}

describe('parseLiftEntry', () => {
    test('parses entry name, senses and fields', () => {
        const entry = parse(ENTRY_A);
        expect(entry.id).toBe(0);
        expect(entry.lexicalName).toEqual([{ ws: 0, text: 'a' }]);
        expect(entry.fieldsBeforeSenses.map((f) => f.kind)).toEqual(['custom', 'pronunciation']);
        expect(entry.senses).toHaveLength(1);

        const sense = entry.senses[0];
        expect(sense.partOfSpeech).toBe('indefinite article');
        expect(sense.glosses).toEqual([{ ws: 1, text: 'INDEF' }]);
        expect(sense.definitions).toEqual([{ ws: 1, text: 'a' }]);
        expect(sense.fields.map((f) => f.kind)).toEqual(['example', 'note', 'relation']);

        const example = sense.fields[0];
        expect(example.kind === 'example' && example.translations[0].text).toBe(
            'L<span>et me tell you a story.</span>'
        );
    });

    test('numbers senses when there is more than one', () => {
        const entry = parse(ENTRY_BEEN);
        expect(entry.senses.map((s) => s.senseNumber)).toEqual(['1', '2']);
        expect(getSubEntryIds(entry)).toEqual([17]);
    });

    test('reads main entry of sub-entry', () => {
        expect(parse(ENTRY_BEENA).mainEntryId).toBe(16);
    });

    test('escapes text that is not a span', () => {
        const entry = parse(`<e id="1"><l><f l="0"><t>a &lt;b&gt;</t></f></l></e>`);
        expect(entry.lexicalName[0].text).toBe('a &lt;b&gt;');
    });

    test('returns undefined for invalid xml', () => {
        expect(parseLiftEntry('<e><l>', ['gul'])).toBeUndefined();
    });
});

describe('liftEntriesToHtml', () => {
    test('writes single entry using dab-app.css classes', () => {
        const div = render(liftEntriesToHtml([parse(ENTRY_A)], options()));

        expect(div.querySelector('div.entry-block-single span.entry-name-gul')?.textContent).toBe(
            'a'
        );
        expect(div.querySelector('span.prononciation')?.textContent).toBe('[ʌ]');
        expect(div.querySelector('span.part-of-speech')?.textContent).toBe('indefinite article');
        // definition is preferred over gloss
        expect(div.querySelector('div.gloss-line-en span.gloss-en')?.textContent).toBe('a');
        expect(div.querySelector('span.bullet')).not.toBeNull();
        expect(div.querySelector('span.sense-number')).toBeNull();
        // summary definition has no label
        expect(div.querySelector('div.field-block span.label')).toBeNull();
        expect(div.querySelector('span.field-en')?.textContent).toBe('a');
        expect(div.querySelector('span.example-text-gul')?.textContent).toBe(
            'Leh me tell ya a story. '
        );
        expect(div.querySelector('span.example-translation-en')?.textContent).toBe(
            'Let me tell you a story.'
        );
        expect(div.querySelector('div.note-line')?.textContent).toBe('Reference: Di Root  1.1');

        const relation = div.querySelector('div.relation-line');
        expect(relation?.textContent).toBe('Cross ref: A');
        expect(relation?.querySelector('a')?.getAttribute('href')).toBe('E-2');
    });

    test('omits fields that are hidden or not configured', () => {
        const div = render(
            liftEntriesToHtml(
                [parse(ENTRY_A)],
                options({ fields: fields.filter((f) => f.type !== 'note') })
            )
        );
        expect(div.querySelector('div.note-block')).toBeNull();
    });

    test('omits relations that cannot be resolved', () => {
        const div = render(
            liftEntriesToHtml([parse(ENTRY_A)], options({ resolveRelation: () => undefined }))
        );
        expect(div.querySelector('div.relation-block')).toBeNull();
    });

    test('writes sense numbers, homonym index and sub-entries', () => {
        const beena = parse(ENTRY_BEENA);
        const div = render(
            liftEntriesToHtml(
                [parse(ENTRY_BEEN, 2)],
                options({ getSubEntry: (id) => (id === 17 ? beena : undefined) })
            )
        );

        expect(div.querySelector('span.entry-homonym-index')?.innerHTML).toBe('<sub>2</sub>');
        expect(
            Array.from(div.querySelectorAll('span.sense-number')).map((s) => s.textContent)
        ).toEqual(['1', '2']);
        // different parts of speech per sense are written with the gloss
        expect(
            Array.from(div.querySelectorAll('div.gloss-line-en span.part-of-speech')).map(
                (s) => s.textContent
            )
        ).toEqual(['copula verb. ', 'preverbal particle. ']);

        const subEntry = div.querySelector('div.subentry-block');
        expect(subEntry?.querySelector('span.label')?.textContent).toBe('Contraction:');
        expect(subEntry?.querySelector('span.subentry-name-gul')?.textContent).toBe('beena');
    });

    test('writes compact entries with links in multiple entry mode', () => {
        const html = liftEntriesToHtml(
            [parse(ENTRY_A), parse(ENTRY_BEENA)],
            options({ mode: 'multiple' })
        );
        const div = render(html);

        expect(div.querySelectorAll('div.entry-block-multiple')).toHaveLength(2);
        expect(div.querySelector('div.gloss-block')).toBeNull();
        // sub-entry links to its main entry
        expect(
            Array.from(div.querySelectorAll('span[class^="entry-name"] a')).map((a) =>
                a.getAttribute('href')
            )
        ).toEqual(['E-0', 'E-16']);
        expect(div.querySelector('span.gloss-en')?.textContent).toBe('a');
        expect(html).toContain('<span class="gloss-en">.</span>');
    });

    test('escapes plain text from attributes, the database and config', () => {
        const xml = `<e id="5"><l><f l="0"><t>x</t></f></l><s id="5"><h value="n &lt;b&gt; &amp; adj"/><g l="1"><t>g</t></g><r type="cross ref" ref="S2"/><v><tr name="dialect" value="&lt;i&gt;North&lt;/i&gt;"/><f l="0"><t>y</t></f></v></s></e>`;
        const div = render(
            liftEntriesToHtml(
                [parse(xml)],
                options({
                    fields: [
                        ...fields.filter((f) => f.type !== 'relation'),
                        field('relation', 'cross ref', 'See <also> & more:'),
                        { ...field('variant', '(Default)', 'Variant:'), beforeItem: '<' }
                    ],
                    resolveRelation: () => ({ id: 2, name: 'A<b>', homonymIndex: 0 })
                })
            )
        );

        expect(div.querySelector('span.part-of-speech')?.textContent).toBe('n <b> & adj');
        expect(div.querySelector('div.relation-line')?.textContent).toBe('See <also> & more: A<b>');
        expect(div.querySelector('div.field-line')?.textContent).toBe('Variant: <y (<i>North</i>)');
        expect(div.querySelector('b, i, also')).toBeNull();
    });
});
