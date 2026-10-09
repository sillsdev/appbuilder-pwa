/**
 * Model and parser for LIFT entries stored in the xml column of data.sqlite.
 *
 * DAB writes each entry with short tag names (see LiftTag.java) and writing systems
 * referenced by index (l="0") into the lexicon writing system list, e.g.
 *
 *   <e id="0"><l><f l="0"><t>a</t></f></l><s id="0"><h value="noun"/><g l="1"><t>...</t></g></s></e>
 *
 * This is a port of the parts of LiftHandler.java (app-lib-dictionary) that the app uses
 * when loading entries from the database.
 */

export type MultiTextItem = { ws: number; text: string };
export type MultiText = MultiTextItem[];

export type Trait = { name: string; value: string };

export type ExampleField = {
    kind: 'example';
    text: MultiText;
    translations: MultiText;
    media: string[];
};
export type ImageField = { kind: 'image'; filename: string };
export type NoteField = { kind: 'note'; type: string; text: MultiText };
export type CustomField = { kind: 'custom'; type: string; text: MultiText };
export type PronunciationField = { kind: 'pronunciation'; text: MultiText; media: string[] };
export type RelationField = { kind: 'relation'; type: string; ref: string; traits: Trait[] };
export type SubEntryField = {
    kind: 'subentry';
    // 'sub': main entry -> sub-entry, 'main': sub-entry -> main entry
    direction: 'sub' | 'main';
    ref: string;
    traits: Trait[];
};
export type VariantField = { kind: 'variant'; text: MultiText; traits: Trait[] };

export type LiftField =
    | ExampleField
    | ImageField
    | NoteField
    | CustomField
    | PronunciationField
    | RelationField
    | SubEntryField
    | VariantField;

export type LiftSense = {
    id: string;
    senseNumber: string;
    partOfSpeech: string;
    glosses: MultiText;
    definitions: MultiText;
    fields: LiftField[];
    fieldsBeforeDef: LiftField[];
};

export type LiftEntry = {
    id: number;
    // entry index of the main entry if this is a sub-entry
    mainEntryId?: number;
    homonymIndex: number;
    lexicalName: MultiText;
    citationForm: MultiText;
    senses: LiftSense[];
    fieldsBeforeSenses: LiftField[];
    fieldsAfterSenses: LiftField[];
};

// Short and long tag names (LiftTag.java)
const TAGS: Record<string, string> = {
    c: 'citation',
    d: 'definition',
    e: 'entry',
    x: 'example',
    y: 'etymology',
    z: 'field',
    f: 'form',
    g: 'gloss',
    h: 'grammatical-info',
    i: 'illustration',
    l: 'lexical-unit',
    m: 'main-entry',
    md: 'media',
    n: 'note',
    p: 'pronunciation',
    r: 'relation',
    q: 'reversal',
    s: 'sense',
    t: 'text',
    tr: 'trait',
    a: 'translation',
    v: 'variant'
};

function liftTag(el: Element | null): string {
    if (!el) {
        return '';
    }
    const name = el.tagName;
    return TAGS[name] ?? name;
}

export function getByWritingSystem(mt: MultiText, ws: number): string {
    return mt.find((item) => item.ws === ws)?.text ?? '';
}

export function hasWritingSystem(mt: MultiText, ws: number): boolean {
    return mt.some((item) => item.ws === ws);
}

export function hasText(mt: MultiText): boolean {
    return mt.some((item) => item.text.trim() !== '');
}

export function hasGloss(sense: LiftSense) {
    return hasText(sense.glosses);
}

export function hasDefinitions(sense: LiftSense) {
    return sense.definitions.length > 0;
}

export function hasGlossOrDefinitions(sense: LiftSense) {
    return hasDefinitions(sense) || hasGloss(sense);
}

function isSenseEmpty(sense: LiftSense) {
    return !hasGlossOrDefinitions(sense) && sense.fields.length === 0 && sense.senseNumber === '';
}

function escapeHtml(text: string) {
    return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeAttr(text: string) {
    return escapeHtml(text).replaceAll('"', '&quot;');
}

/**
 * Text content of a <t> element. <span> elements are kept as HTML (as LiftHandler does),
 * everything else is escaped.
 */
function textValue(el: Element): string {
    let result = '';
    for (const node of el.childNodes) {
        if (node.nodeType === 3 /* TEXT_NODE */) {
            result += escapeHtml(node.nodeValue ?? '');
        } else if (node.nodeType === 1 /* ELEMENT_NODE */) {
            const child = node as Element;
            if (child.tagName === 'span') {
                const attrs = Array.from(child.attributes)
                    .map((attr) => ` ${attr.name}="${escapeAttr(attr.value)}"`)
                    .join('');
                result += `<span${attrs}>${textValue(child)}</span>`;
            } else {
                result += textValue(child);
            }
        }
    }
    return result;
}

function filenameWithoutPath(filename: string) {
    return filename.substring(Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\')) + 1);
}

/**
 * Parse a LIFT entry from data.sqlite.
 *
 * @param xml contents of the xml column
 * @param writingSystems writing system codes in lexicon order (used for long form lang="xx")
 * @param homonymIndex from the homonym_index column
 */
export function parseLiftEntry(
    xml: string,
    writingSystems: string[],
    homonymIndex = 0
): LiftEntry | undefined {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const root = doc.documentElement;
    if (!root || liftTag(root) !== 'entry' || root.getElementsByTagName('parsererror').length) {
        return undefined;
    }

    const entry: LiftEntry = {
        id: parseInt(root.getAttribute('id') ?? '', 10),
        homonymIndex,
        lexicalName: [],
        citationForm: [],
        senses: [],
        fieldsBeforeSenses: [],
        fieldsAfterSenses: []
    };

    let currentSense: LiftSense | null = null;
    let currentExample: ExampleField | null = null;
    let currentCustomField: CustomField | null = null;
    let currentNote: NoteField | null = null;
    let currentPronunciation: PronunciationField | null = null;
    let currentRelation: RelationField | SubEntryField | null = null;
    let currentVariant: VariantField | null = null;
    let inReversal = false;
    let currentLang = -1;
    let sensesAdded = 0;

    function getCurrentFields(): LiftField[] | null {
        let result: LiftField[] | null = null;
        if (!currentSense) {
            result = sensesAdded > 0 ? entry.fieldsAfterSenses : entry.fieldsBeforeSenses;
        } else if (entry.senses.length === 1 && isSenseEmpty(currentSense)) {
            // not started senses yet, so add to entry
            result = entry.fieldsBeforeSenses;
        }
        if (!result && currentSense) {
            result = hasGlossOrDefinitions(currentSense)
                ? currentSense.fields
                : currentSense.fieldsBeforeDef;
        }
        return result;
    }

    function langFromAttributes(el: Element): number {
        const index = el.getAttribute('l');
        if (index) {
            const n = parseInt(index, 10);
            return isNaN(n) ? -1 : n;
        }
        const code = el.getAttribute('lang');
        return code ? writingSystems.indexOf(code) : -1;
    }

    function start(el: Element, parentTag: string) {
        switch (liftTag(el)) {
            case 'sense': {
                if (sensesAdded > 0) {
                    entry.senses[0].senseNumber = '1';
                }
                currentSense = {
                    id: el.getAttribute('id') ?? '',
                    senseNumber: '',
                    partOfSpeech: '',
                    glosses: [],
                    definitions: [],
                    fields: [],
                    fieldsBeforeDef: []
                };
                entry.senses.push(currentSense);
                sensesAdded++;
                if (sensesAdded > 1) {
                    currentSense.senseNumber = String(sensesAdded);
                }
                break;
            }
            case 'example':
                if (currentSense) {
                    currentExample = { kind: 'example', text: [], translations: [], media: [] };
                    currentSense.fields.push(currentExample);
                }
                break;
            case 'field': {
                const type = el.getAttribute('type');
                const fields = getCurrentFields();
                if (type !== null && fields) {
                    currentCustomField = { kind: 'custom', type, text: [] };
                    fields.push(currentCustomField);
                }
                break;
            }
            case 'form':
            case 'gloss':
                currentLang = langFromAttributes(el);
                break;
            case 'grammatical-info': {
                const value = el.getAttribute('value');
                if (currentSense && !inReversal && value !== null) {
                    currentSense.partOfSpeech = value;
                }
                break;
            }
            case 'main-entry': {
                const id = parseInt(el.getAttribute('id') ?? '', 10);
                if (!isNaN(id)) {
                    entry.mainEntryId = id;
                }
                break;
            }
            case 'media': {
                const href = el.getAttribute('href');
                if (href) {
                    const filename = filenameWithoutPath(href);
                    if (currentExample) {
                        currentExample.media.push(filename);
                    } else if (currentPronunciation) {
                        currentPronunciation.media.push(filename);
                    }
                }
                break;
            }
            case 'illustration': {
                const href = el.getAttribute('href');
                if (href) {
                    getCurrentFields()?.push({ kind: 'image', filename: href });
                }
                break;
            }
            case 'note': {
                const type = el.getAttribute('type');
                const fields = getCurrentFields();
                if (type !== null && fields) {
                    currentNote = { kind: 'note', type, text: [] };
                    fields.push(currentNote);
                }
                break;
            }
            case 'pronunciation':
                currentPronunciation = { kind: 'pronunciation', text: [], media: [] };
                getCurrentFields()?.push(currentPronunciation);
                break;
            case 'relation': {
                const type = el.getAttribute('type');
                const ref = el.getAttribute('ref');
                const fields = getCurrentFields();
                if (type !== null && ref !== null && fields) {
                    const lowerType = type.toLowerCase();
                    if (lowerType === 'subentry' || lowerType === '_component-lexeme') {
                        currentRelation = {
                            kind: 'subentry',
                            direction: lowerType === 'subentry' ? 'sub' : 'main',
                            ref,
                            traits: []
                        };
                    } else {
                        currentRelation = { kind: 'relation', type, ref, traits: [] };
                    }
                    fields.push(currentRelation);
                }
                break;
            }
            case 'reversal':
                inReversal = !!currentSense;
                break;
            case 'trait': {
                const name = el.getAttribute('name');
                const value = el.getAttribute('value');
                if (name !== null && value !== null) {
                    if (parentTag === 'relation' && currentRelation) {
                        currentRelation.traits.push({ name, value });
                    } else if (parentTag === 'variant' && currentVariant) {
                        currentVariant.traits.push({ name, value });
                    }
                }
                break;
            }
            case 'variant':
                currentVariant = { kind: 'variant', text: [], traits: [] };
                getCurrentFields()?.push(currentVariant);
                break;
        }
    }

    function end(el: Element) {
        switch (liftTag(el)) {
            case 'sense':
                currentSense = null;
                break;
            case 'example':
                currentExample = null;
                break;
            case 'field':
                currentCustomField = null;
                break;
            case 'note':
                currentNote = null;
                break;
            case 'pronunciation':
                currentPronunciation = null;
                break;
            case 'relation':
                currentRelation = null;
                break;
            case 'reversal':
                inReversal = false;
                break;
            case 'variant':
                currentVariant = null;
                break;
        }
    }

    function text(el: Element, parentTag: string, grandparentTag: string) {
        const item = { ws: currentLang, text: textValue(el) };
        if (parentTag === 'form') {
            switch (grandparentTag) {
                case 'lexical-unit':
                    entry.lexicalName.push(item);
                    break;
                case 'citation':
                    entry.citationForm.push(item);
                    break;
                case 'definition':
                    currentSense?.definitions.push(item);
                    break;
                case 'example':
                    currentExample?.text.push(item);
                    break;
                case 'field':
                    currentCustomField?.text.push(item);
                    break;
                case 'translation':
                    currentExample?.translations.push(item);
                    break;
                case 'note':
                    currentNote?.text.push(item);
                    break;
                case 'pronunciation':
                    currentPronunciation?.text.push(item);
                    break;
                case 'variant':
                    currentVariant?.text.push(item);
                    break;
            }
        } else if (parentTag === 'gloss' && currentSense) {
            addGloss(currentSense, item);
        } else if (parentTag === 'definition' && currentSense) {
            currentSense.definitions.push(item);
        }
    }

    function walk(el: Element, parentTag: string) {
        const tag = liftTag(el);
        if (tag === 'text') {
            text(el, parentTag, liftTag(el.parentElement?.parentElement ?? null));
            return;
        }
        start(el, parentTag);
        for (const child of el.children) {
            walk(child, tag);
        }
        end(el);
    }

    for (const child of root.children) {
        walk(child, 'entry');
    }

    return entry;
}

function addGloss(sense: LiftSense, item: MultiTextItem) {
    if (item.text.trim() === '') {
        return;
    }
    const existing = sense.glosses.find((g) => g.ws === item.ws);
    if (existing && existing.text.trim() !== '') {
        existing.text = existing.text + ' ; ' + item.text;
    } else {
        sense.glosses.push(item);
    }
}

/**
 * Entry ids referred to by sub-entry relations (main entry -> sub-entry)
 */
export function getSubEntryIds(entry: LiftEntry): number[] {
    const fields = [
        ...entry.fieldsBeforeSenses,
        ...entry.senses.flatMap((s) => [...s.fieldsBeforeDef, ...s.fields]),
        ...entry.fieldsAfterSenses
    ];
    return fields
        .filter((f): f is SubEntryField => f.kind === 'subentry' && f.direction === 'sub')
        .map((f) => getFirstDigitsAsInt(f.ref))
        .filter((id) => !isNaN(id));
}

export function getFirstDigitsAsInt(ref: string): number {
    const m = ref.match(/\d+/);
    return m ? parseInt(m[0], 10) : NaN;
}
